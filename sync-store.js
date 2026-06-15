import { createHash, randomBytes, pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import https from "node:https";
import { access, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { networkInterfaces, tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(ROOT_DIR, ".librepos");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const TOKEN_FILE = path.join(DATA_DIR, "sync-token");
const VERSION_FILE = path.join(DATA_DIR, "app-version.json");
const BODY_LIMIT = 8 * 1024 * 1024;
const ACCESS_COOKIE = "librepos_sync";
const PASSWORD_ITERATIONS = 120000;
const PASSWORD_KEYLEN = 32;
const PASSWORD_DIGEST = "sha256";
const UPDATE_REPO_OWNER = "JMartinezRuiz";
const UPDATE_REPO_NAME = "LIbepos";
const UPDATE_BRANCH = "main";
const UPDATE_PROJECT_PREFIX = "";
const UPDATE_REPO_URL = `https://github.com/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}`;
const PRESERVED_UPDATE_DIRS = new Set([".git", ".librepos", ".vite", "node_modules", "dist"]);
const PRESERVED_UPDATE_FILES = new Set([".DS_Store", ".env", ".env.local"]);
const IGNORED_LOCAL_UPDATE_DIRS = new Set(["__pycache__"]);
const IGNORED_LOCAL_UPDATE_EXTENSIONS = new Set([".pyc", ".pyo"]);
const RECEIPT_WIDTH = 32;
const RESTAURANT_ADDRESS = "Direccion del restaurante";
const BRAND_IMAGE_FILE = path.join(ROOT_DIR, "assets", "brand.jpg");
const DEFAULT_TICKET_MARGIN_MM = 4;
const DEFAULT_TICKET_LOGO_WIDTH_MM = 24;
const DEFAULT_TICKET_LOGO_POSITION = "below-title";
const DEFAULT_IVA_RATE = 0.16;
const RECEIPT_LOGO_MARKER = "__LIBREPOS_LOGO__";
const RECEIPT_BRAND_TITLE = "-- LIBREPOS --";
const GITHUB_API_HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "LibrePOS-Updater",
  "X-GitHub-Api-Version": "2022-11-28",
};

let sharedState = null;
let sharedVersion = 0;
let accessToken = "";
let updateInProgress = false;
const clients = new Set();
const execFile = promisify(execFileCallback);

async function loadSharedState() {
  if (sharedState) return;
  try {
    const data = JSON.parse(await readFile(STATE_FILE, "utf8"));
    const normalized = normalizeStateForStorage(data.state || null);
    sharedState = normalized.state;
    sharedVersion = Number(data.version) || 0;
    if (normalized.changed) {
      await writeStateFile();
    }
  } catch {
    sharedState = null;
    sharedVersion = 0;
  }
}

async function ensureAccessToken() {
  if (accessToken) return accessToken;
  await mkdir(DATA_DIR, { recursive: true });
  try {
    accessToken = (await readFile(TOKEN_FILE, "utf8")).trim();
  } catch {
    accessToken = randomBytes(32).toString("hex");
    await writeFile(TOKEN_FILE, accessToken);
  }
  return accessToken;
}

async function writeStateFile() {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify({ version: sharedVersion, state: sharedState }, null, 2));
}

async function saveSharedState(state, clientId = "") {
  await mkdir(DATA_DIR, { recursive: true });
  const normalized = normalizeStateForStorage(state, sharedState);
  sharedState = normalized.state;
  sharedVersion = Math.max(Date.now(), sharedVersion + 1);
  await writeStateFile();
  broadcast({ type: "state", version: sharedVersion, state: publicState(sharedState), clientId });
  return { version: sharedVersion, state: publicState(sharedState) };
}

function broadcast(payload) {
  const data = `event: ${payload.type}\ndata: ${JSON.stringify(payload)}\n\n`;
  clients.forEach((client) => {
    try {
      client.write(data);
    } catch {
      clients.delete(client);
    }
  });
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > BODY_LIMIT) {
        reject(new Error("payload-too-large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function hashPassword(password, salt = randomBytes(16).toString("hex"), iterations = PASSWORD_ITERATIONS) {
  return {
    passwordHash: pbkdf2Sync(String(password), salt, iterations, PASSWORD_KEYLEN, PASSWORD_DIGEST).toString("hex"),
    passwordSalt: salt,
    passwordIterations: iterations,
  };
}

function verifyPassword(user, password) {
  if (!user || user.active === false) return false;
  if (user.passwordHash && user.passwordSalt) {
    const iterations = Number(user.passwordIterations) || PASSWORD_ITERATIONS;
    const attempted = hashPassword(password, user.passwordSalt, iterations).passwordHash;
    try {
      return timingSafeEqual(Buffer.from(attempted, "hex"), Buffer.from(user.passwordHash, "hex"));
    } catch {
      return false;
    }
  }
  return typeof user.password === "string" && user.password === String(password);
}

function cleanUsername(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("es-MX");
}

function sameUsername(left, right) {
  return cleanUsername(left) === cleanUsername(right);
}

function normalizeStateForStorage(state, existingState = null) {
  if (!state || typeof state !== "object") return { state: null, changed: false };
  let changed = false;
  const next = structuredClone(state);
  const rawUsers = Array.isArray(next.users) ? next.users : [];
  const users = rawUsers.filter((user) => user.active !== false);
  if (users.length !== rawUsers.length) changed = true;
  const existingUsers = Array.isArray(existingState?.users) ? existingState.users : [];
  next.users = users.map((user) => {
    const normalized = { ...user };
    const existing = existingUsers.find((item) => item.id === normalized.id || sameUsername(item.username, normalized.username));
    const password = typeof normalized.password === "string" ? normalized.password.trim() : "";
    if (password) {
      Object.assign(normalized, hashPassword(password));
      delete normalized.password;
      changed = true;
    } else if (typeof normalized.password === "string") {
      delete normalized.password;
      changed = true;
    }
    if (!normalized.passwordHash && existing?.passwordHash && existing?.passwordSalt) {
      normalized.passwordHash = existing.passwordHash;
      normalized.passwordSalt = existing.passwordSalt;
      normalized.passwordIterations = existing.passwordIterations;
    }
    if (!normalized.passwordHash && sameUsername(normalized.username, "admin")) {
      Object.assign(normalized, hashPassword("admin"));
      changed = true;
    }
    return normalized;
  });
  return { state: next, changed };
}

function publicState(state) {
  if (!state || typeof state !== "object") return state;
  const copy = structuredClone(state);
  copy.users = Array.isArray(copy.users)
    ? copy.users.map(({ password, passwordHash, passwordSalt, passwordIterations, ...user }) => user)
    : [];
  return copy;
}

function validateStatePayload(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) return "missing-state";
  const arrayKeys = [
    "users",
    "orders",
    "sales",
    "cancellations",
    "inventory",
    "ingredientCategories",
    "inventoryMovements",
    "expenses",
    "menuProducts",
    "extraCatalog",
    "attendance",
    "cashSessions",
  ];
  for (const key of arrayKeys) {
    if (!Array.isArray(state[key])) return `invalid-${key}`;
  }
  if (!state.settings || typeof state.settings !== "object" || Array.isArray(state.settings)) return "invalid-settings";
  return "";
}

function lanAccessUrls(req) {
  const host = String(req.headers.host || "localhost:5173");
  const port = host.includes(":") ? host.split(":").pop() : "5173";
  const urls = [`http://localhost:${port}/`];
  Object.values(networkInterfaces()).forEach((entries = []) => {
    entries.forEach((entry) => {
      if (entry.family !== "IPv4" || entry.internal || !entry.address) return;
      const url = `http://${entry.address}:${port}/`;
      if (!urls.includes(url)) urls.push(url);
    });
  });
  const preferredUrl = urls.find((url) => !url.includes("localhost")) || urls[0];
  return { preferredUrl, urls };
}

function cookieValue(req, name) {
  const cookie = req.headers.cookie || "";
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function requestOriginAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

async function setAccessCookie(res) {
  const token = await ensureAccessToken();
  res.setHeader("Set-Cookie", `${ACCESS_COOKIE}=${token}; Path=/; SameSite=Lax`);
  return token;
}

async function requireAccess(req, res) {
  const token = await ensureAccessToken();
  if (!requestOriginAllowed(req)) {
    sendJson(res, 403, { error: "origin-not-allowed" });
    return false;
  }
  if (cookieValue(req, ACCESS_COOKIE) !== token) {
    sendJson(res, 403, { error: "sync-access-required" });
    return false;
  }
  return true;
}

function githubApiUrl(pathname) {
  return `https://api.github.com/repos/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}${pathname}`;
}

function githubRawUrl(githubPath, ref = UPDATE_BRANCH) {
  const encodedRef = String(ref || UPDATE_BRANCH).split("/").map(encodeURIComponent).join("/");
  const encodedPath = githubPath.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}/${encodedRef}/${encodedPath}`;
}

function requestUrl(url, { json = true, headers = {}, timeout = 25000 } = {}, redirects = 0) {
  return new Promise((resolve, reject) => {
    const target = url instanceof URL ? url : new URL(url);
    const req = https.request(
      target,
      {
        method: "GET",
        headers,
      },
      (res) => {
        const status = res.statusCode || 0;
        if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
          res.resume();
          if (redirects >= 5) {
            reject(new Error("download-redirect-limit"));
            return;
          }
          resolve(requestUrl(new URL(res.headers.location, target), { json, headers, timeout }, redirects + 1));
          return;
        }

        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks);
          if (status < 200 || status >= 300) {
            reject(new Error(`download-${status}: ${body.toString("utf8").slice(0, 240)}`));
            return;
          }
          if (!json) {
            resolve(body);
            return;
          }
          try {
            resolve(JSON.parse(body.toString("utf8")));
          } catch {
            reject(new Error("download-invalid-json"));
          }
        });
      },
    );
    req.setTimeout(timeout, () => {
      req.destroy(new Error("download-timeout"));
    });
    req.on("error", reject);
    req.end();
  });
}

function requestGithub(url, { json = true, headers = {} } = {}) {
  return requestUrl(url, {
    json,
    headers: { ...GITHUB_API_HEADERS, ...headers },
  });
}

async function readLocalAppVersion() {
  try {
    const version = JSON.parse(await readFile(VERSION_FILE, "utf8"));
    if (version?.commitSha) {
      return { commitSha: String(version.commitSha), source: "version-file", updatedAt: version.updatedAt || "" };
    }
  } catch {
    // Older installs do not have this file yet.
  }

  try {
    const { stdout } = await execFile("git", ["log", "-n", "1", "--format=%H", "--", "."], {
      cwd: ROOT_DIR,
      timeout: 5000,
      maxBuffer: 64 * 1024,
    });
    const commitSha = stdout.trim();
    if (commitSha) return { commitSha, source: "git", updatedAt: "" };
  } catch {
    // ZIP installs normally do not have git metadata.
  }

  return { commitSha: null, source: "unknown", updatedAt: "" };
}

async function readLocalPackageVersion() {
  try {
    const data = JSON.parse(await readFile(path.join(ROOT_DIR, "package.json"), "utf8"));
    return typeof data.version === "string" ? data.version.trim() : "";
  } catch {
    return "";
  }
}

async function fetchRemotePackageVersion(ref = UPDATE_BRANCH) {
  try {
    const buffer = await requestGithub(githubRawUrl(`${UPDATE_PROJECT_PREFIX}package.json`, ref), {
      json: false,
      headers: { Accept: "application/octet-stream" },
    });
    const data = JSON.parse(buffer.toString("utf8"));
    return typeof data.version === "string" ? data.version.trim() : "";
  } catch {
    return "";
  }
}

async function writeLocalAppVersion(commitSha) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    VERSION_FILE,
    JSON.stringify(
      {
        commitSha,
        branch: UPDATE_BRANCH,
        repo: `${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}`,
        projectPath: UPDATE_PROJECT_PREFIX.replace(/\/$/, ""),
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

async function fetchLatestRemoteVersion() {
  const commitsUrl = new URL(githubApiUrl("/commits"));
  commitsUrl.searchParams.set("sha", UPDATE_BRANCH);
  const projectPath = UPDATE_PROJECT_PREFIX.replace(/\/$/, "");
  if (projectPath) {
    commitsUrl.searchParams.set("path", projectPath);
  }
  commitsUrl.searchParams.set("per_page", "1");
  const commits = await requestGithub(commitsUrl);
  const latest = Array.isArray(commits) ? commits[0] : null;
  if (!latest?.sha) return null;
  return {
    commitSha: latest.sha,
    htmlUrl: latest.html_url || `${UPDATE_REPO_URL}/commit/${latest.sha}`,
    date: latest.commit?.committer?.date || latest.commit?.author?.date || "",
  };
}

export async function getUpdateStatus() {
  const [storedLocal, remote] = await Promise.all([readLocalAppVersion(), fetchLatestRemoteVersion()]);
  let local = storedLocal;
  let localIncludesRemote = false;
  let localPackageVersion = "";
  let remotePackageVersion = "";
  if (remote?.commitSha && storedLocal.source === "git" && !sameCommit(storedLocal.commitSha, remote.commitSha)) {
    localIncludesRemote = await gitCommitIncludes(remote.commitSha, storedLocal.commitSha);
  }
  if (remote?.commitSha && !localIncludesRemote && !sameCommit(storedLocal.commitSha, remote.commitSha)) {
    try {
      const remoteFiles = await fetchRemoteProjectFiles(remote.commitSha);
      local = (await readLocalVersionFromFiles(remoteFiles, remote.commitSha)) || storedLocal;
    } catch {
      local = storedLocal;
    }
    if (!sameCommit(local.commitSha, remote.commitSha)) {
      [localPackageVersion, remotePackageVersion] = await Promise.all([readLocalPackageVersion(), fetchRemotePackageVersion(remote.commitSha)]);
      if (localPackageVersion && remotePackageVersion && localPackageVersion === remotePackageVersion) {
        local = { commitSha: remote.commitSha, source: "package-version", updatedAt: "", packageVersion: localPackageVersion };
      }
    }
    if (sameCommit(local.commitSha, remote.commitSha) && local.source !== "version-file") {
      try {
        await writeLocalAppVersion(remote.commitSha);
      } catch (error) {
        updateLog("No se pudo escribir marcador local de version", { error: compactError(error) });
      }
    }
  }
  const available = Boolean(remote?.commitSha && !localIncludesRemote && (!local.commitSha || !sameCommit(local.commitSha, remote.commitSha)));
  return {
    available,
    repoUrl: UPDATE_REPO_URL,
    branch: UPDATE_BRANCH,
    projectPath: UPDATE_PROJECT_PREFIX.replace(/\/$/, ""),
    localCommit: local.commitSha,
    localSource: local.source,
    localIncludesRemote,
    localUpdatedAt: local.updatedAt,
    localPackageVersion: localPackageVersion || local.packageVersion || "",
    remotePackageVersion,
    remoteCommit: remote?.commitSha || null,
    remoteUrl: remote?.htmlUrl || UPDATE_REPO_URL,
    remoteDate: remote?.date || "",
    checkedAt: new Date().toISOString(),
  };
}

function sameCommit(left, right) {
  if (!left || !right) return false;
  const a = String(left);
  const b = String(right);
  return a === b || a.startsWith(b) || b.startsWith(a);
}

function compactError(error) {
  const details = [
    error?.message,
    error?.stderr,
    error?.stdout,
    error?.code ? `code:${error.code}` : "",
  ].filter(Boolean).join(" ");
  return String(details || error || "unknown").replace(/\s+/g, " ").slice(0, 700);
}

function stripAccents(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function serverUserIsAdmin(user) {
  if (!user || user.active === false) return false;
  const functions = Array.isArray(user.functions) ? user.functions.map((item) => String(item).toLowerCase()) : [];
  const role = stripAccents(user.role).toLowerCase();
  return functions.includes("admin") || role.includes("admin");
}

function serverUserHasFunction(user, functionId) {
  if (serverUserIsAdmin(user)) return true;
  if (!user || user.active === false) return false;
  const functions = Array.isArray(user.functions) ? user.functions.map((item) => String(item).toLowerCase()) : [];
  const role = stripAccents(user.role).toLowerCase();
  const target = String(functionId || "").toLowerCase();
  return functions.includes(target) || role.includes(target);
}

async function requireAdminUser(res, userId) {
  await loadSharedState();
  const user = (sharedState?.users || []).find((item) => item.id === userId);
  if (!serverUserIsAdmin(user)) {
    sendJson(res, 403, { error: "admin-required" });
    return false;
  }
  return true;
}

async function requireCashUser(res, userId) {
  await loadSharedState();
  const user = (sharedState?.users || []).find((item) => item.id === userId);
  if (!serverUserHasFunction(user, "caja")) {
    sendJson(res, 403, { error: "cash-required" });
    return false;
  }
  return true;
}

async function requirePrinterUser(res, userId) {
  await loadSharedState();
  const user = (sharedState?.users || []).find((item) => item.id === userId);
  if (!serverUserHasFunction(user, "caja") && !serverUserHasFunction(user, "mesero")) {
    sendJson(res, 403, { error: "printer-user-required" });
    return false;
  }
  return true;
}

function printerLines(stdout) {
  return String(stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const TICKET_PRINTER_TERMS = [
  "ticket",
  "receipt",
  "thermal",
  "termica",
  "termico",
  "pos",
  "epson",
  "star",
  "bixolon",
  "xprinter",
  "x-printer",
  "citizen",
  "zebra",
  "tm-t",
  "tmt",
  "80mm",
  "58mm",
];

function compactPrinterText(value) {
  return stripAccents(value).toLowerCase();
}

function ticketPrinterScore(printer) {
  const haystack = compactPrinterText([
    printer.name,
    printer.driverName,
    printer.portName,
    printer.deviceUri,
  ].filter(Boolean).join(" "));
  return TICKET_PRINTER_TERMS.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function decoratePrinter(printer) {
  const score = ticketPrinterScore(printer);
  return {
    name: String(printer.name || "").trim(),
    isDefault: Boolean(printer.isDefault),
    isTicketLikely: score > 0,
    source: printer.source || "system",
    driverName: printer.driverName || "",
    portName: printer.portName || "",
    deviceUri: printer.deviceUri || "",
    printerStatus: printer.printerStatus || "",
    workOffline: Boolean(printer.workOffline),
  };
}

function sortPrinters(printers) {
  return printers
    .map(decoratePrinter)
    .filter((printer) => printer.name)
    .sort((left, right) => {
      if (left.isTicketLikely !== right.isTicketLikely) return left.isTicketLikely ? -1 : 1;
      if (left.isDefault !== right.isDefault) return left.isDefault ? -1 : 1;
      return left.name.localeCompare(right.name, "es");
    });
}

function defaultPrinterFromLpstat(stdout) {
  const text = String(stdout || "").trim();
  return text.match(/:\s*(.+)$/)?.[1]?.trim() || "";
}

function cupsPrinterDevices(stdout) {
  const devices = new Map();
  printerLines(stdout).forEach((line) => {
    const match = line.match(/^(?:device|dispositivo)\s+(?:for|para)\s+(.+?):\s*(.+)$/i);
    if (match) devices.set(match[1].trim(), match[2].trim());
  });
  return devices;
}

async function listCupsPrinters() {
  const [printerResult, defaultResult, deviceResult] = await Promise.allSettled([
    execFile("lpstat", ["-e"], { timeout: 5000, maxBuffer: 128 * 1024 }),
    execFile("lpstat", ["-d"], { timeout: 5000, maxBuffer: 128 * 1024 }),
    execFile("lpstat", ["-v"], { timeout: 5000, maxBuffer: 256 * 1024 }),
  ]);
  if (printerResult.status === "rejected") throw printerResult.reason;
  const defaultName = defaultResult.status === "fulfilled" ? defaultPrinterFromLpstat(defaultResult.value.stdout) : "";
  const devices = deviceResult.status === "fulfilled" ? cupsPrinterDevices(deviceResult.value.stdout) : new Map();
  return sortPrinters(printerLines(printerResult.value.stdout).map((name) => ({
    name,
    isDefault: Boolean(defaultName && name === defaultName),
    deviceUri: devices.get(name) || "",
    source: "cups",
  })));
}

function powerShellCandidates() {
  if (process.platform !== "win32") return ["pwsh", "pwsh.exe", "powershell", "powershell.exe"];
  const windowsDir = process.env.SystemRoot || process.env.WINDIR || "C:\\Windows";
  return [
    path.join(windowsDir, "Sysnative", "WindowsPowerShell", "v1.0", "powershell.exe"),
    path.join(windowsDir, "System32", "WindowsPowerShell", "v1.0", "powershell.exe"),
    "powershell.exe",
    "powershell",
    "pwsh.exe",
    "pwsh",
  ].filter((command, index, list) => command && list.indexOf(command) === index);
}

async function runPowerShell(script, args = [], options = {}) {
  const scriptPath = path.join(tmpdir(), `librepos-powershell-${Date.now()}-${randomBytes(4).toString("hex")}.ps1`);
  await writeFile(scriptPath, script, "utf8");
  const attempts = [];
  try {
    for (const command of powerShellCandidates()) {
      if (path.isAbsolute(command)) {
        try {
          await access(command);
        } catch {
          continue;
        }
      }
      const commandArgs = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath, ...args];
      if (process.platform !== "win32" && command.startsWith("pwsh")) {
        commandArgs.splice(1, 2);
      }
      try {
        return await execFile(command, commandArgs, {
          timeout: options.timeout ?? 10000,
          maxBuffer: options.maxBuffer ?? 512 * 1024,
          windowsHide: true,
        });
      } catch (error) {
        attempts.push(`${command}: ${compactError(error)}`);
        if (error?.code !== "ENOENT") {
          const wrapped = new Error(`powershell-failed ${attempts.join(" | ")}`);
          wrapped.stderr = error.stderr;
          wrapped.stdout = error.stdout;
          wrapped.code = error.code;
          throw wrapped;
        }
      }
    }
    throw new Error(`powershell-not-found ${attempts.join(" | ")}`);
  } finally {
    try {
      await rm(scriptPath, { force: true });
    } catch {
      // Best effort cleanup.
    }
  }
}

async function listWindowsPrinters() {
  const { stdout } = await runPowerShell("Get-CimInstance Win32_Printer | Select-Object Name,Default,DriverName,PortName,PrinterStatus,WorkOffline | ConvertTo-Json -Compress");
  if (!stdout.trim()) return [];
  const parsed = JSON.parse(stdout);
  return sortPrinters((Array.isArray(parsed) ? parsed : [parsed]).map((printer) => ({
    name: String(printer.Name || "").trim(),
    isDefault: Boolean(printer.Default),
    driverName: String(printer.DriverName || "").trim(),
    portName: String(printer.PortName || "").trim(),
    printerStatus: String(printer.PrinterStatus || "").trim(),
    workOffline: Boolean(printer.WorkOffline),
    source: "windows",
  })));
}

export async function listSystemPrinters() {
  try {
    const printers = process.platform === "win32" ? await listWindowsPrinters() : await listCupsPrinters();
    return { printers, platform: process.platform };
  } catch (error) {
    return { printers: [], platform: process.platform, error: compactError(error) };
  }
}

function testTicketText(printerName) {
  return [
    "LibrePOS",
    "------------------------",
    "test",
    "------------------------",
    `Impresora: ${printerName}`,
    new Date().toLocaleString("es-MX"),
    "",
    "",
  ].join("\n");
}

function legacyTicketText() {
  return "PRUEBA IMPRESORA BT\nHola desde PowerShell\n\n\n";
}

const FAKE_RECEIPT_PRODUCTS = [
  { name: "Bocoles maiz", price: 165, extras: [{ name: "Extra queso", price: 20 }, { name: "Salsa verde", price: 10 }] },
  { name: "Enchiladas rojas", price: 180, extras: [{ name: "Cecina", price: 45 }, { name: "Aguacate", price: 25 }] },
  { name: "Tamales hoja platano", price: 45, extras: [{ name: "Crema", price: 12 }] },
  { name: "Zacahuil", price: 95, extras: [{ name: "Salsa extra", price: 10 }] },
  { name: "Molotes platano", price: 120, extras: [{ name: "Queso extra", price: 20 }] },
  { name: "Cafe de olla", price: 35, extras: [] },
  { name: "Agua mineral", price: 45, extras: [{ name: "Limon", price: 8 }] },
  { name: "Hojuelas", price: 65, extras: [{ name: "Miel extra", price: 15 }] },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sampleItems(items, count) {
  const pool = [...items];
  const selected = [];
  while (selected.length < count && pool.length) {
    selected.push(pool.splice(randomInt(0, pool.length - 1), 1)[0]);
  }
  return selected;
}

function receiptMoney(value) {
  const number = roundCurrency(value);
  return `$${new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(number)}`;
}

function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function cleanIvaRate(value) {
  const rate = Number(value);
  if (!Number.isFinite(rate)) return DEFAULT_IVA_RATE;
  const normalized = rate > 1 ? rate / 100 : rate;
  return Math.max(0, Math.min(1, normalized));
}

function sharedIvaEnabled() {
  return Boolean(sharedState?.settings?.ivaEnabled);
}

function sharedIvaRate() {
  return cleanIvaRate(sharedState?.settings?.ivaRate);
}

function taxBreakdownForGross(value, rate = sharedIvaEnabled() ? sharedIvaRate() : 0) {
  const gross = roundCurrency(value);
  const ivaRate = cleanIvaRate(rate);
  if (!gross || !ivaRate) return { gross, netSubtotal: gross, iva: 0, ivaRate };
  const netSubtotal = roundCurrency(gross / (1 + ivaRate));
  return {
    gross,
    netSubtotal,
    iva: roundCurrency(gross - netSubtotal),
    ivaRate,
  };
}

function ivaLabel(rate = DEFAULT_IVA_RATE) {
  return `IVA ${Math.round(cleanIvaRate(rate) * 100)}%`;
}

function receiptSanitize(value) {
  return stripAccents(value)
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function receiptCenter(value, width = RECEIPT_WIDTH) {
  const text = receiptSanitize(value).slice(0, width);
  const left = Math.max(0, Math.floor((width - text.length) / 2));
  return `${" ".repeat(left)}${text}`;
}

function receiptRule(char = "-") {
  return char.repeat(RECEIPT_WIDTH);
}

function receiptColumns(left, right, width = RECEIPT_WIDTH) {
  const cleanRight = receiptSanitize(right);
  const maxLeft = Math.max(1, width - cleanRight.length - 1);
  const cleanLeft = receiptSanitize(left).slice(0, maxLeft);
  const spaces = Math.max(1, width - cleanLeft.length - cleanRight.length);
  return `${cleanLeft}${" ".repeat(spaces)}${cleanRight}`;
}

function receiptWrap(value, width = RECEIPT_WIDTH) {
  const text = receiptSanitize(value);
  if (!text) return [];
  const words = text.split(" ");
  const lines = [];
  let line = "";
  words.forEach((rawWord) => {
    let word = rawWord;
    while (word.length > width) {
      if (line) {
        lines.push(line);
        line = "";
      }
      lines.push(word.slice(0, width));
      word = word.slice(width);
    }
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= width) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function receiptCenteredWrap(value) {
  return receiptWrap(value).map((line) => receiptCenter(line));
}

function cleanTicketMarginMm(value) {
  const margin = Math.round(Number(value));
  if (!Number.isFinite(margin)) return DEFAULT_TICKET_MARGIN_MM;
  return Math.max(0, Math.min(20, margin));
}

function ticketMarginsFromOptions(options = {}) {
  const fallback = typeof options === "object" && options !== null ? options.marginMm : options;
  const leftSource = typeof options === "object" && options !== null && options.marginLeftMm !== undefined ? options.marginLeftMm : fallback;
  const rightSource = typeof options === "object" && options !== null && options.marginRightMm !== undefined ? options.marginRightMm : fallback;
  return {
    leftMm: cleanTicketMarginMm(leftSource),
    rightMm: cleanTicketMarginMm(rightSource),
  };
}

function cleanTicketLogoWidthMm(value) {
  const width = Math.round(Number(value));
  if (!Number.isFinite(width)) return DEFAULT_TICKET_LOGO_WIDTH_MM;
  return Math.max(10, Math.min(48, width));
}

function cleanTicketLogoPosition(value) {
  return value === "above-title" ? "above-title" : DEFAULT_TICKET_LOGO_POSITION;
}

function marginMmToHundredthsInchRaw(value) {
  return Math.round(value * 100 / 25.4);
}

function logoWidthMmToHundredthsInch(value) {
  return Math.round(cleanTicketLogoWidthMm(value) * 100 / 25.4);
}

function marginMmToPointsRaw(value) {
  return value * 72 / 25.4;
}

async function resolveTicketLogoFile(logoDataUrl = "") {
  const dataUrl = String(logoDataUrl || "").trim();
  const match = dataUrl.match(/^data:image\/(png|jpe?g);base64,([a-z0-9+/=\s]+)$/i);
  if (!match) {
    return { filePath: BRAND_IMAGE_FILE, cleanup: async () => {} };
  }
  const extension = match[1].toLowerCase().startsWith("jp") ? "jpg" : "png";
  const filePath = path.join(tmpdir(), `librepos-ticket-logo-${Date.now()}-${randomBytes(4).toString("hex")}.${extension}`);
  await writeFile(filePath, Buffer.from(match[2].replace(/\s+/g, ""), "base64"));
  return {
    filePath,
    cleanup: async () => {
      await rm(filePath, { force: true });
    },
  };
}

function replaceLibrePosLineWithLogoMarker(text, includeLogo = false, logoPosition = DEFAULT_TICKET_LOGO_POSITION) {
  if (!includeLogo) return text;
  const lines = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const normalizedLines = lines.map((line) => (isReceiptBrandTitle(line) ? receiptCenter(RECEIPT_BRAND_TITLE) : line));
  const withoutLibrePos = normalizedLines.filter((line) => line.trim() !== "LibrePOS");
  const titleIndex = withoutLibrePos.findIndex(isReceiptBrandTitle);
  if (titleIndex >= 0) {
    withoutLibrePos[titleIndex] = receiptCenter(RECEIPT_BRAND_TITLE);
    const markerIndex = cleanTicketLogoPosition(logoPosition) === "above-title" ? titleIndex : titleIndex + 1;
    withoutLibrePos.splice(markerIndex, 0, RECEIPT_LOGO_MARKER);
  }
  return withoutLibrePos.join("\n");
}

function isReceiptBrandTitle(line) {
  const title = receiptSanitize(line);
  return title === "LIBREPOS" || title === RECEIPT_BRAND_TITLE;
}

function localReceiptDate(date = new Date()) {
  return [
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
  ].join(" ");
}

function normalizeFakeReceiptType(value) {
  return value === "postpaid" ? "postpaid" : "prepaid";
}

function fakeReceiptText(type = "prepaid") {
  const receiptType = normalizeFakeReceiptType(type);
  const now = new Date();
  const table = randomInt(1, 13);
  const folio = randomInt(1, 999);
  const selected = sampleItems(FAKE_RECEIPT_PRODUCTS, randomInt(3, 5));
  const lines = [];
  let subtotal = 0;
  const ivaRate = sharedIvaEnabled() ? sharedIvaRate() : 0;
  selected.forEach((product) => {
    const qty = randomInt(1, product.price > 100 ? 2 : 3);
    const lineTotal = qty * product.price;
    subtotal += lineTotal;
    lines.push(receiptColumns(`${qty} ${product.name}`, receiptMoney(taxBreakdownForGross(lineTotal, ivaRate).netSubtotal)));
    if (product.extras.length && Math.random() > 0.45) {
      const extra = product.extras[randomInt(0, product.extras.length - 1)];
      subtotal += extra.price;
      lines.push(receiptColumns(`  + ${extra.name}`, receiptMoney(taxBreakdownForGross(extra.price, ivaRate).netSubtotal)));
    }
  });
  const tax = taxBreakdownForGross(subtotal, ivaRate);
  const tipRate = [10, 12, 15][randomInt(0, 2)];
  const tip = receiptType === "postpaid" ? Math.round(subtotal * tipRate / 100) : 0;
  const total = subtotal + tip;
  const card = Math.random() > 0.5;
  const paid = card ? total : Math.ceil(total / 50) * 50;
  const change = Math.max(0, paid - total);
  return [
    receiptCenter(RECEIPT_BRAND_TITLE),
    receiptCenter("LibrePOS"),
    ...receiptCenteredWrap(RESTAURANT_ADDRESS),
    receiptCenter(receiptType === "postpaid" ? "PRUEBA POSTPAGO" : "PRUEBA PREPAGO"),
    receiptRule(),
    receiptColumns("Folio", folio),
    localReceiptDate(now),
    receiptColumns(`Mesa ${table}`, "Mesero Ivanna"),
    receiptRule(),
    ...lines,
    receiptRule(),
    receiptColumns("Subtotal s/IVA", receiptMoney(tax.netSubtotal)),
    receiptColumns(ivaLabel(tax.ivaRate), receiptMoney(tax.iva)),
    receiptType === "postpaid" ? receiptColumns("Consumo", receiptMoney(subtotal)) : null,
    receiptType === "postpaid" ? receiptColumns(`Propina ${tipRate}%`, receiptMoney(tip)) : null,
    receiptColumns("TOTAL", receiptMoney(total)),
    receiptType === "prepaid" ? receiptCenter("Pendiente de pago") : null,
    receiptType === "postpaid" ? receiptColumns(card ? "Pago tarjeta" : "Pago efectivo", receiptMoney(paid)) : null,
    receiptType === "postpaid" && !card ? receiptColumns("Cambio", receiptMoney(change)) : null,
    receiptRule(),
    receiptCenter("Gracias por su visita"),
    "",
    "",
    "",
  ].filter((line) => line !== null).join("\n");
}

function receiptHeaderText() {
  return [
    receiptCenter(RECEIPT_BRAND_TITLE),
    receiptCenter("LibrePOS"),
    ...receiptCenteredWrap(RESTAURANT_ADDRESS),
    receiptCenter("CUENTA DE PRUEBA"),
    "",
    "",
  ].join("\n");
}

function windowsTicketPayload(printerName) {
  const text = testTicketText(printerName).replace(/\n/g, "\r\n");
  return Buffer.concat([
    Buffer.from([0x1b, 0x40]),
    Buffer.from(text, "ascii"),
    Buffer.from("\r\n\r\n\r\n", "ascii"),
    Buffer.from([0x1d, 0x56, 0x42, 0x00]),
  ]);
}

async function printWithCups(printerName, filePath, { marginMm = null, marginLeftMm = null, marginRightMm = null } = {}) {
  const args = ["-d", printerName, "-t", "LibrePOS test"];
  if (marginLeftMm !== null || marginRightMm !== null || marginMm !== null) {
    const margins = ticketMarginsFromOptions({ marginMm, marginLeftMm, marginRightMm });
    args.push(
      "-o",
      `page-left=${Math.round(marginMmToPointsRaw(margins.leftMm))}`,
      "-o",
      `page-right=${Math.round(marginMmToPointsRaw(margins.rightMm))}`,
    );
  }
  args.push(filePath);
  await execFile("lp", args, {
    timeout: 20000,
    maxBuffer: 128 * 1024,
  });
  return { method: "cups-lp" };
}

function pdfNumber(value) {
  return Number(value).toFixed(2).replace(/\.?0+$/, "");
}

function pdfEscapeText(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function pdfObject(number, body) {
  return Buffer.from(`${number} 0 obj\n${body}\nendobj\n`, "binary");
}

function pdfStreamObject(number, dictionary, stream) {
  return Buffer.concat([
    Buffer.from(`${number} 0 obj\n<< ${dictionary} /Length ${stream.length} >>\nstream\n`, "binary"),
    stream,
    Buffer.from("\nendstream\nendobj\n", "binary"),
  ]);
}

function pdfDocument(objects) {
  const header = Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary");
  const buffers = [header];
  const offsets = [0];
  let offset = header.length;
  objects.forEach((object, index) => {
    offsets[index + 1] = offset;
    buffers.push(object);
    offset += object.length;
  });
  const xrefOffset = offset;
  const xref = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((item) => `${String(item).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
    "",
  ].join("\n");
  return Buffer.concat([...buffers, Buffer.from(xref, "binary")]);
}

function jpegDimensions(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 4 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    if (startOfFrameMarkers.has(marker) && offset + 7 <= buffer.length) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }
    offset += length;
  }
  return null;
}

async function resolveTicketLogoJpeg(logoDataUrl = "") {
  const logoFile = await resolveTicketLogoFile(logoDataUrl);
  const extraCleanupFiles = [];
  const cleanup = async () => {
    await Promise.all(extraCleanupFiles.map((file) => rm(file, { force: true })));
    await logoFile.cleanup();
  };
  try {
    let filePath = logoFile.filePath;
    if (path.extname(filePath).toLowerCase() === ".png") {
      const jpegPath = path.join(tmpdir(), `librepos-ticket-logo-${Date.now()}-${randomBytes(4).toString("hex")}.jpg`);
      await execFile("sips", ["-s", "format", "jpeg", filePath, "--out", jpegPath], { timeout: 15000, maxBuffer: 512 * 1024 });
      extraCleanupFiles.push(jpegPath);
      filePath = jpegPath;
    }
    const buffer = await readFile(filePath);
    const dimensions = jpegDimensions(buffer);
    if (!dimensions) {
      await cleanup();
      return null;
    }
    return {
      buffer,
      ...dimensions,
      cleanup,
    };
  } catch {
    await cleanup();
    return null;
  }
}

async function createReceiptPdfFile(text, options = {}) {
  const { logoDataUrl = "", logoWidthMm = DEFAULT_TICKET_LOGO_WIDTH_MM } = options;
  const margins = ticketMarginsFromOptions(options);
  const lines = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const logo = lines.some((line) => line === RECEIPT_LOGO_MARKER) ? await resolveTicketLogoJpeg(logoDataUrl) : null;
  const paperWidth = 58 * 72 / 25.4;
  const leftMargin = marginMmToPointsRaw(margins.leftMm);
  const rightMargin = marginMmToPointsRaw(margins.rightMm);
  const availableWidth = Math.max(1, paperWidth - leftMargin - rightMargin);
  const logoWidth = Math.min(logoWidthMmToHundredthsInch(logoWidthMm) * 72 / 100, availableWidth);
  const logoHeight = logo ? Math.max(1, logoWidth * (logo.height / logo.width)) : 0;
  const fontSize = Math.min(7, Math.max(5.4, availableWidth / (RECEIPT_WIDTH * 0.6)));
  const lineHeight = Math.ceil(fontSize + 2);
  const topMargin = 8;
  const bottomMargin = 18;
  const contentHeight = lines.reduce((height, line) => {
    if (line === RECEIPT_LOGO_MARKER) return height + (logo ? logoHeight + 6 : 0);
    return height + lineHeight;
  }, 0);
  const pageHeight = Math.max(260, topMargin + contentHeight + bottomMargin);
  const contentCommands = [];
  let cursorTop = pageHeight - topMargin;
  lines.forEach((line) => {
    if (line === RECEIPT_LOGO_MARKER) {
      if (logo) {
        const x = leftMargin + Math.max(0, (availableWidth - logoWidth) / 2);
        const y = cursorTop - logoHeight;
        contentCommands.push(`q ${pdfNumber(logoWidth)} 0 0 ${pdfNumber(logoHeight)} ${pdfNumber(x)} ${pdfNumber(y)} cm /Im1 Do Q`);
        cursorTop -= logoHeight + 6;
      }
      return;
    }
    const y = cursorTop - fontSize;
    contentCommands.push(`BT /F1 ${pdfNumber(fontSize)} Tf 1 0 0 1 ${pdfNumber(leftMargin)} ${pdfNumber(y)} Tm (${pdfEscapeText(line)}) Tj ET`);
    cursorTop -= lineHeight;
  });
  const content = Buffer.from(`${contentCommands.join("\n")}\n`, "binary");
  const resources = logo
    ? "<< /Font << /F1 5 0 R >> /XObject << /Im1 6 0 R >> >>"
    : "<< /Font << /F1 5 0 R >> >>";
  const objects = [
    pdfObject(1, "<< /Type /Catalog /Pages 2 0 R >>"),
    pdfObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    pdfObject(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfNumber(paperWidth)} ${pdfNumber(pageHeight)}] /Resources ${resources} /Contents 4 0 R >>`),
    pdfStreamObject(4, "", content),
    pdfObject(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>"),
  ];
  if (logo) {
    objects.push(pdfStreamObject(6, `/Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`, logo.buffer));
  }
  const filePath = path.join(tmpdir(), `librepos-receipt-${Date.now()}-${randomBytes(4).toString("hex")}.pdf`);
  try {
    await writeFile(filePath, pdfDocument(objects));
  } finally {
    if (logo) await logo.cleanup();
  }
  return filePath;
}

async function printReceiptWithCupsDocument(printerName, text, options = {}) {
  const marginMm = typeof options === "object" && options !== null ? options.marginMm : options;
  const marginLeftMm = typeof options === "object" && options !== null ? options.marginLeftMm : null;
  const marginRightMm = typeof options === "object" && options !== null ? options.marginRightMm : null;
  const hasLogoMarker = String(text || "").split(/\r\n|\r|\n/).some((line) => line === RECEIPT_LOGO_MARKER);
  const filePath = hasLogoMarker
    ? await createReceiptPdfFile(text, options)
    : path.join(tmpdir(), `librepos-receipt-${Date.now()}-${randomBytes(4).toString("hex")}.txt`);
  if (!hasLogoMarker) await writeFile(filePath, text, "utf8");
  try {
    const result = await printWithCups(printerName, filePath, {
      marginMm: hasLogoMarker ? null : marginMm,
      marginLeftMm: hasLogoMarker ? null : marginLeftMm,
      marginRightMm: hasLogoMarker ? null : marginRightMm,
    });
    return { method: hasLogoMarker ? "cups-lp-pdf-logo" : result.method };
  } finally {
    await rm(filePath, { force: true });
  }
}

async function printWithWindowsRaw(printerName, payload) {
  const script = String.raw`
$ErrorActionPreference = "Stop"
$printerName = $args[0]
$payload = [Convert]::FromBase64String($args[1])
$printer = Get-CimInstance Win32_Printer | Where-Object { $_.Name -eq $printerName } | Select-Object -First 1
if (-not $printer) { throw "printer-not-found:$printerName" }
if ($printer.WorkOffline) { throw "printer-offline:$printerName" }
Add-Type -TypeDefinition @"
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

public class LibrePosRawPrinter {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
  public class DOCINFOA {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
  }

  [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
  public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);

  [DllImport("winspool.Drv", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
  public static extern bool ClosePrinter(IntPtr hPrinter);

  [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In] DOCINFOA di);

  [DllImport("winspool.Drv", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);

  [DllImport("winspool.Drv", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.Drv", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.Drv", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

  public static void Send(string printerName, byte[] bytes) {
    IntPtr hPrinter = IntPtr.Zero;
    if (!OpenPrinter(printerName, out hPrinter, IntPtr.Zero)) Fail("OpenPrinter");
    try {
      DOCINFOA docInfo = new DOCINFOA();
      docInfo.pDocName = "LibrePOS test";
      docInfo.pDataType = "RAW";
      if (!StartDocPrinter(hPrinter, 1, docInfo)) Fail("StartDocPrinter");
      bool pageStarted = false;
      try {
        if (!StartPagePrinter(hPrinter)) Fail("StartPagePrinter");
        pageStarted = true;
        IntPtr unmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
        try {
          Marshal.Copy(bytes, 0, unmanagedBytes, bytes.Length);
          int written = 0;
          if (!WritePrinter(hPrinter, unmanagedBytes, bytes.Length, out written)) Fail("WritePrinter");
          if (written != bytes.Length) throw new Exception("WritePrinter wrote " + written + " of " + bytes.Length + " bytes");
        } finally {
          Marshal.FreeCoTaskMem(unmanagedBytes);
        }
      } finally {
        if (pageStarted) EndPagePrinter(hPrinter);
        EndDocPrinter(hPrinter);
      }
    } finally {
      ClosePrinter(hPrinter);
    }
  }

  private static void Fail(string operation) {
    int error = Marshal.GetLastWin32Error();
    throw new Win32Exception(error, operation + " failed: " + new Win32Exception(error).Message);
  }
}
"@
[LibrePosRawPrinter]::Send($printerName, $payload)
Write-Output ("printed:" + $printerName + ":" + $printer.PortName)
`;
  await runPowerShell(script, [printerName, payload.toString("base64")], { timeout: 25000, maxBuffer: 1024 * 1024 });
  return { method: "windows-raw-spooler" };
}

async function printWithWindowsTextFallback(printerName, payload) {
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "$printer = $args[0]",
    "$text = [Text.Encoding]::ASCII.GetString([Convert]::FromBase64String($args[1]))",
    "$text | Out-Printer -Name $printer",
  ].join("; ");
  await runPowerShell(script, [printerName, payload.toString("base64")], { timeout: 25000, maxBuffer: 1024 * 1024 });
  return { method: "windows-out-printer" };
}

async function printWithWindows(printerName) {
  const payload = windowsTicketPayload(printerName);
  try {
    return await printWithWindowsRaw(printerName, payload);
  } catch (rawError) {
    try {
      return await printWithWindowsTextFallback(printerName, payload);
    } catch (fallbackError) {
      throw new Error(`windows-print-failed raw=${compactError(rawError)} fallback=${compactError(fallbackError)}`);
    }
  }
}

async function printTextWithWindowsLegacy(printerName, text, method = "windows-out-printer-legacy") {
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "$printer = $args[0]",
    "$text = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($args[1]))",
    "$text | Out-Printer -Name $printer",
    `Write-Output ("${method}:" + $printer)`,
  ].join("\n");
  await runPowerShell(script, [printerName, Buffer.from(text, "utf8").toString("base64")], { timeout: 25000, maxBuffer: 1024 * 1024 });
  return { method };
}

function windowsLegacyReceiptText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => (line === RECEIPT_LOGO_MARKER ? RECEIPT_BRAND_TITLE : line))
    .join("\n");
}

async function printReceiptWithWindowsFallback(printerName, text, options = {}, method = "windows-out-printer-receipt-fallback") {
  try {
    return await printReceiptWithWindowsDocument(printerName, text, options);
  } catch (documentError) {
    try {
      const fallback = await printTextWithWindowsLegacy(printerName, windowsLegacyReceiptText(text), method);
      return {
        method: fallback?.method || method,
        fallbackFrom: compactError(documentError),
      };
    } catch (fallbackError) {
      throw new Error(`windows-receipt-print-failed document=${compactError(documentError)} legacy=${compactError(fallbackError)}`);
    }
  }
}

async function printWithWindowsLegacy(printerName) {
  return printTextWithWindowsLegacy(printerName, legacyTicketText(), "windows-out-printer-legacy");
}

async function printReceiptWithWindowsDocument(printerName, text, options = {}) {
  const logoDataUrl = typeof options === "object" && options !== null ? options.logoDataUrl : "";
  const logoWidthMm = typeof options === "object" && options !== null ? options.logoWidthMm : DEFAULT_TICKET_LOGO_WIDTH_MM;
  const margins = ticketMarginsFromOptions(options);
  const leftMargin = marginMmToHundredthsInchRaw(margins.leftMm);
  const rightMargin = marginMmToHundredthsInchRaw(margins.rightMm);
  const logoWidth = logoWidthMmToHundredthsInch(logoWidthMm);
  const hasLogoMarker = String(text || "").split(/\r\n|\r|\n/).some((line) => line === RECEIPT_LOGO_MARKER);
  const logoFile = hasLogoMarker ? await resolveTicketLogoFile(logoDataUrl) : { filePath: "", cleanup: async () => {} };
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "Add-Type -AssemblyName System.Drawing",
    "$printer = $args[0]",
    "$text = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($args[1]))",
    "$lines = $text -replace \"`r`n\", \"`n\" -replace \"`r\", \"`n\" -split \"`n\"",
    "$paperWidth = 228",
    "$leftMargin = [int]$args[2]",
    "$rightMargin = [int]$args[3]",
    "$logoPath = [string]$args[4]",
    "$logoWidthTarget = [int]$args[5]",
    `$logoMarker = '${RECEIPT_LOGO_MARKER}'`,
    "$logo = $null",
    "if ($logoPath -and (Test-Path -LiteralPath $logoPath)) { $logo = [System.Drawing.Image]::FromFile($logoPath) }",
    "$availableWidth = [Math]::Max(1, $paperWidth - $leftMargin - $rightMargin)",
    "$targetLogoWidth = [Math]::Max(1, [Math]::Min($logoWidthTarget, $availableWidth))",
    "$targetLogoHeight = 0",
    "if ($logo -ne $null) { $targetLogoHeight = [Math]::Max(1, [Math]::Round($targetLogoWidth * ([double]$logo.Height / [double]$logo.Width))) }",
    "$logoLineCount = @($lines | Where-Object { $_ -eq $logoMarker }).Count",
    "$paperHeight = [Math]::Max(550, (($lines.Count + 8) * 14) + (($targetLogoHeight + 8) * $logoLineCount))",
    "$doc = New-Object System.Drawing.Printing.PrintDocument",
    "$doc.PrinterSettings.PrinterName = $printer",
    "if (-not $doc.PrinterSettings.IsValid) { throw \"printer-not-valid:$printer\" }",
    "$doc.DocumentName = 'LibrePOS cuenta 58mm'",
    "$doc.DefaultPageSettings.PaperSize = New-Object System.Drawing.Printing.PaperSize('LibrePOS 58mm', $paperWidth, $paperHeight)",
    "$doc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins($leftMargin, $rightMargin, 2, 2)",
    `$fontSize = [Math]::Min(7.0, [Math]::Max(5.4, (($availableWidth * 72.0 / 100.0) / (${RECEIPT_WIDTH} * 0.6))))`,
    "$font = New-Object System.Drawing.Font('Courier New', $fontSize, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Point)",
    "$brush = [System.Drawing.Brushes]::Black",
    "$script:lineIndex = 0",
    "$doc.add_PrintPage({",
    "  param($sender, $event)",
    "  $x = $leftMargin",
    "  $y = 2",
    "  $lineHeight = [Math]::Ceiling($font.GetHeight($event.Graphics)) + 1",
    "  $bottom = $event.PageBounds.Height - 4",
    "  while ($script:lineIndex -lt $lines.Count) {",
    "    $line = [string]$lines[$script:lineIndex]",
    "    if ($line -eq $logoMarker) {",
    "      if ($logo -ne $null) {",
    "        if ($y + $targetLogoHeight + 6 -gt $bottom -and $y -gt 2) {",
    "          $event.HasMorePages = $true",
    "          return",
    "        }",
    "        $logoX = $leftMargin + [Math]::Max(0, [Math]::Round(($availableWidth - $targetLogoWidth) / 2))",
    "        $rect = [System.Drawing.RectangleF]::new([float]$logoX, [float]$y, [float]$targetLogoWidth, [float]$targetLogoHeight)",
    "        $event.Graphics.DrawImage($logo, $rect)",
    "        $y += $targetLogoHeight + 6",
    "      }",
    "      $script:lineIndex += 1",
    "      continue",
    "    }",
    "    $event.Graphics.DrawString($line, $font, $brush, $x, $y)",
    "    $y += $lineHeight",
    "    $script:lineIndex += 1",
    "    if ($y + $lineHeight -gt $bottom -and $script:lineIndex -lt $lines.Count) {",
    "      $event.HasMorePages = $true",
    "      return",
    "    }",
    "  }",
    "  $event.HasMorePages = $false",
    "})",
    "try { $doc.Print(); Write-Output ('windows-printdocument-58mm:' + $printer) } finally { $font.Dispose(); if ($logo -ne $null) { $logo.Dispose() }; $doc.Dispose() }",
  ].join("\n");
  try {
    await runPowerShell(script, [
      printerName,
      Buffer.from(text, "utf8").toString("base64"),
      String(leftMargin),
      String(rightMargin),
      logoFile.filePath,
      String(logoWidth),
    ], { timeout: 30000, maxBuffer: 1024 * 1024 });
    return { method: hasLogoMarker ? "windows-printdocument-logo" : "windows-printdocument" };
  } finally {
    await logoFile.cleanup();
  }
}

async function printLogoWithWindowsDocument(printerName, options = {}) {
  const logoDataUrl = typeof options === "object" && options !== null ? options.logoDataUrl : "";
  const logoWidthMm = typeof options === "object" && options !== null ? options.logoWidthMm : DEFAULT_TICKET_LOGO_WIDTH_MM;
  const margins = ticketMarginsFromOptions(options);
  const leftMargin = marginMmToHundredthsInchRaw(margins.leftMm);
  const rightMargin = marginMmToHundredthsInchRaw(margins.rightMm);
  const logoWidth = logoWidthMmToHundredthsInch(logoWidthMm);
  const logoFile = await resolveTicketLogoFile(logoDataUrl);
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "Add-Type -AssemblyName System.Drawing",
    "$printer = $args[0]",
    "$imagePath = $args[1]",
    "$leftMargin = [int]$args[2]",
    "$rightMargin = [int]$args[3]",
    "$logoWidthTarget = [int]$args[4]",
    "if (-not (Test-Path -LiteralPath $imagePath)) { throw \"logo-not-found:$imagePath\" }",
    "$image = [System.Drawing.Image]::FromFile($imagePath)",
    "$doc = New-Object System.Drawing.Printing.PrintDocument",
    "$doc.PrinterSettings.PrinterName = $printer",
    "if (-not $doc.PrinterSettings.IsValid) { throw \"printer-not-valid:$printer\" }",
    "$doc.DocumentName = 'LibrePOS logo'",
    "$paperWidth = 228",
    "$availableWidth = [Math]::Max(1, $paperWidth - $leftMargin - $rightMargin)",
    "$targetWidth = [Math]::Max(1, [Math]::Min($logoWidthTarget, $availableWidth))",
    "$imageHeight = [Math]::Max(1, [Math]::Round($targetWidth * ([double]$image.Height / [double]$image.Width)))",
    "$paperHeight = [Math]::Max(260, $imageHeight + 28)",
    "$doc.DefaultPageSettings.PaperSize = New-Object System.Drawing.Printing.PaperSize('LibrePOS logo', $paperWidth, $paperHeight)",
    "$doc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins($leftMargin, $rightMargin, 2, 2)",
    "$doc.add_PrintPage({",
    "  param($sender, $event)",
    "  $x = $leftMargin + [Math]::Max(0, [Math]::Round(($availableWidth - $targetWidth) / 2))",
    "  $y = 8",
    "  $rect = [System.Drawing.RectangleF]::new([float]$x, [float]$y, [float]$targetWidth, [float]$imageHeight)",
    "  $event.Graphics.DrawImage($image, $rect)",
    "  $event.HasMorePages = $false",
    "})",
    "try { $doc.Print(); Write-Output ('windows-print-logo:' + $printer) } finally { $image.Dispose(); $doc.Dispose() }",
  ].join("\n");
  try {
    await runPowerShell(script, [printerName, logoFile.filePath, String(leftMargin), String(rightMargin), String(logoWidth)], { timeout: 30000, maxBuffer: 1024 * 1024 });
    return { method: "windows-print-logo" };
  } finally {
    await logoFile.cleanup();
  }
}

async function removeWindowsPrinter(printerName) {
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "$printerName = $args[0]",
    "$printer = Get-CimInstance Win32_Printer | Where-Object { $_.Name -eq $printerName } | Select-Object -First 1",
    "if (-not $printer) { throw \"printer-not-found:$printerName\" }",
    "try { Remove-Printer -Name $printerName -ErrorAction Stop } catch { $result = $printer.Delete(); if ($result.ReturnValue -ne 0) { throw \"printer-delete-failed:$($result.ReturnValue) $($_.Exception.Message)\" } }",
  ].join("; ");
  await runPowerShell(script, [printerName], { timeout: 20000, maxBuffer: 512 * 1024 });
}

async function removeCupsPrinter(printerName) {
  await execFile("lpadmin", ["-x", printerName], {
    timeout: 20000,
    maxBuffer: 128 * 1024,
  });
}

export async function removeSystemPrinter(printerName) {
  const cleanName = String(printerName || "").trim();
  if (!cleanName) throw new Error("printer-required");
  if (process.platform === "win32") {
    await removeWindowsPrinter(cleanName);
  } else {
    await removeCupsPrinter(cleanName);
  }
  return { ok: true, printerName: cleanName, removedAt: new Date().toISOString() };
}

export async function printLegacyTestTicket(printerName) {
  const cleanName = String(printerName || "").trim();
  if (!cleanName) throw new Error("printer-required");
  let result = null;
  if (process.platform === "win32") {
    result = await printWithWindowsLegacy(cleanName);
  } else {
    const filePath = path.join(tmpdir(), `librepos-legacy-${Date.now()}-${randomBytes(4).toString("hex")}.txt`);
    await writeFile(filePath, legacyTicketText(), "utf8");
    try {
      result = await printWithCups(cleanName, filePath);
    } finally {
      await rm(filePath, { force: true });
    }
  }
  return { ok: true, printerName: cleanName, method: result?.method || "", printedAt: new Date().toISOString() };
}

function cleanReceiptPayload(value) {
  const text = String(value || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return text.slice(0, 6000);
}

export function previewFakeReceiptTicket(type = "prepaid") {
  const receiptType = normalizeFakeReceiptType(type);
  return { ticketText: fakeReceiptText(receiptType), type: receiptType, width: RECEIPT_WIDTH, createdAt: new Date().toISOString() };
}

export async function printFakeReceiptTicket(printerName, ticketText = "", options = {}) {
  const marginMm = typeof options === "object" && options !== null ? options.marginMm : options;
  const margins = ticketMarginsFromOptions(options);
  const logoDataUrl = typeof options === "object" && options !== null ? options.logoDataUrl : "";
  const logoWidthMm = typeof options === "object" && options !== null ? options.logoWidthMm : DEFAULT_TICKET_LOGO_WIDTH_MM;
  const cleanName = String(printerName || "").trim();
  if (!cleanName) throw new Error("printer-required");
  const text = cleanReceiptPayload(ticketText) || fakeReceiptText(options.type);
  const printOptions = { marginMm, marginLeftMm: margins.leftMm, marginRightMm: margins.rightMm, logoDataUrl, logoWidthMm };
  let result = null;
  if (process.platform === "win32") {
    result = await printReceiptWithWindowsFallback(cleanName, `${text}\n\n\n`, printOptions, "windows-out-printer-fake-receipt-fallback");
  } else {
    result = await printReceiptWithCupsDocument(cleanName, `${text}\n\n\n`, printOptions);
  }
  return { ok: true, printerName: cleanName, method: result?.method || "", type: normalizeFakeReceiptType(options.type), marginMm: margins.leftMm, marginLeftMm: margins.leftMm, marginRightMm: margins.rightMm, printedAt: new Date().toISOString(), ticketText: text };
}

export async function printReceiptHeaderTicket(printerName, options = {}) {
  const marginMm = typeof options === "object" && options !== null ? options.marginMm : options;
  const margins = ticketMarginsFromOptions(options);
  const logoDataUrl = typeof options === "object" && options !== null ? options.logoDataUrl : "";
  const logoWidthMm = typeof options === "object" && options !== null ? options.logoWidthMm : DEFAULT_TICKET_LOGO_WIDTH_MM;
  const includeLogo = Boolean(typeof options === "object" && options !== null && options.includeLogo);
  const logoPosition = typeof options === "object" && options !== null ? options.logoPosition : DEFAULT_TICKET_LOGO_POSITION;
  const cleanName = String(printerName || "").trim();
  if (!cleanName) throw new Error("printer-required");
  const text = replaceLibrePosLineWithLogoMarker(receiptHeaderText(), includeLogo, logoPosition);
  const printOptions = { marginMm, marginLeftMm: margins.leftMm, marginRightMm: margins.rightMm, logoDataUrl, logoWidthMm };
  let result = null;
  if (process.platform === "win32") {
    result = await printReceiptWithWindowsFallback(cleanName, `${text}\n\n\n`, printOptions, "windows-out-printer-header-fallback");
  } else {
    result = await printReceiptWithCupsDocument(cleanName, `${text}\n\n\n`, printOptions);
  }
  return { ok: true, printerName: cleanName, method: result?.method || "", marginMm: margins.leftMm, marginLeftMm: margins.leftMm, marginRightMm: margins.rightMm, printedAt: new Date().toISOString(), ticketText: text };
}

export async function printLogoTestTicket(printerName, options = {}) {
  const marginMm = typeof options === "object" && options !== null ? options.marginMm : options;
  const margins = ticketMarginsFromOptions(options);
  const logoDataUrl = typeof options === "object" && options !== null ? options.logoDataUrl : "";
  const logoWidthMm = typeof options === "object" && options !== null ? options.logoWidthMm : DEFAULT_TICKET_LOGO_WIDTH_MM;
  const cleanName = String(printerName || "").trim();
  if (!cleanName) throw new Error("printer-required");
  let result = null;
  if (process.platform === "win32") {
    result = await printLogoWithWindowsDocument(cleanName, { marginMm, marginLeftMm: margins.leftMm, marginRightMm: margins.rightMm, logoDataUrl, logoWidthMm });
  } else {
    const logoFile = await resolveTicketLogoFile(logoDataUrl);
    try {
      result = await printWithCups(cleanName, logoFile.filePath, { marginMm, marginLeftMm: margins.leftMm, marginRightMm: margins.rightMm });
    } finally {
      await logoFile.cleanup();
    }
  }
  return {
    ok: true,
    printerName: cleanName,
    method: result?.method || "",
    marginMm: margins.leftMm,
    marginLeftMm: margins.leftMm,
    marginRightMm: margins.rightMm,
    logoWidthMm: cleanTicketLogoWidthMm(logoWidthMm),
    printedAt: new Date().toISOString(),
    logoPath: logoDataUrl ? "custom" : "/assets/brand.jpg",
  };
}

export async function printSaleReceiptTicket(printerName, ticketText = "", options = {}) {
  const marginMm = typeof options === "object" && options !== null ? options.marginMm : options;
  const margins = ticketMarginsFromOptions(options);
  const logoDataUrl = typeof options === "object" && options !== null ? options.logoDataUrl : "";
  const logoWidthMm = typeof options === "object" && options !== null ? options.logoWidthMm : DEFAULT_TICKET_LOGO_WIDTH_MM;
  const cleanName = String(printerName || "").trim();
  if (!cleanName) throw new Error("printer-required");
  const text = cleanReceiptPayload(ticketText);
  if (!text.trim()) throw new Error("ticket-required");
  const printOptions = { marginMm, marginLeftMm: margins.leftMm, marginRightMm: margins.rightMm, logoDataUrl, logoWidthMm };
  let result = null;
  if (process.platform === "win32") {
    result = await printReceiptWithWindowsFallback(cleanName, `${text}\n\n\n`, printOptions, "windows-out-printer-sale-receipt-fallback");
  } else {
    result = await printReceiptWithCupsDocument(cleanName, `${text}\n\n\n`, printOptions);
  }
  return { ok: true, printerName: cleanName, method: result?.method || "", marginMm: margins.leftMm, marginLeftMm: margins.leftMm, marginRightMm: margins.rightMm, printedAt: new Date().toISOString(), ticketText: text };
}

export async function printTestTicket(printerName) {
  const cleanName = String(printerName || "").trim();
  if (!cleanName) throw new Error("printer-required");
  let result = null;
  if (process.platform === "win32") {
    result = await printWithWindows(cleanName);
  } else {
    const filePath = path.join(tmpdir(), `librepos-test-${Date.now()}-${randomBytes(4).toString("hex")}.txt`);
    await writeFile(filePath, testTicketText(cleanName), "utf8");
    try {
      result = await printWithCups(cleanName, filePath);
    } finally {
      await rm(filePath, { force: true });
    }
  }
  return { ok: true, printerName: cleanName, method: result?.method || "", printedAt: new Date().toISOString() };
}

function updateLog(message, details = null) {
  const suffix = details ? ` ${JSON.stringify(details)}` : "";
  console.log(`[LibrePOS update ${new Date().toISOString()}] ${message}${suffix}`);
}

async function gitCommitIncludes(ancestorCommit, descendantCommit) {
  if (!ancestorCommit || !descendantCommit) return false;
  try {
    await execFile("git", ["merge-base", "--is-ancestor", ancestorCommit, descendantCommit], {
      cwd: ROOT_DIR,
      timeout: 5000,
      maxBuffer: 64 * 1024,
    });
    return true;
  } catch {
    return false;
  }
}

function gitBlobSha(buffer) {
  return createHash("sha1")
    .update(Buffer.from(`blob ${buffer.length}\0`))
    .update(buffer)
    .digest("hex");
}

async function readLocalVersionFromFiles(remoteFiles, remoteCommit) {
  const localFiles = new Set(await listLocalProjectFiles());
  if (localFiles.size !== remoteFiles.length) return null;
  for (const file of remoteFiles) {
    if (!localFiles.has(file.relativePath)) return null;
    const targetPath = path.join(ROOT_DIR, ...file.relativePath.split("/"));
    assertInsideRoot(targetPath);
    const buffer = await readFile(targetPath);
    if (gitBlobSha(buffer) !== file.sha) return null;
  }
  return { commitSha: remoteCommit, source: "files", updatedAt: "" };
}

function safeRemoteRelativePath(githubPath) {
  if (!githubPath.startsWith(UPDATE_PROJECT_PREFIX)) return null;
  const relativePath = githubPath.slice(UPDATE_PROJECT_PREFIX.length);
  if (!relativePath || relativePath.includes("\\")) return null;
  const normalized = path.posix.normalize(relativePath);
  if (!normalized || normalized === "." || normalized.startsWith("../") || path.isAbsolute(normalized)) return null;
  const rootName = normalized.split("/")[0];
  if (PRESERVED_UPDATE_DIRS.has(rootName) || PRESERVED_UPDATE_FILES.has(normalized)) return null;
  return normalized;
}

function shouldIgnoreLocalProjectPath(relativePath) {
  const parts = relativePath.split("/");
  if (parts.some((part) => IGNORED_LOCAL_UPDATE_DIRS.has(part))) return true;
  return IGNORED_LOCAL_UPDATE_EXTENSIONS.has(path.extname(relativePath).toLowerCase());
}

async function fetchRemoteProjectFiles(ref = UPDATE_BRANCH) {
  const commit = await requestGithub(githubApiUrl(`/commits/${encodeURIComponent(ref)}`));
  const treeSha = commit?.commit?.tree?.sha;
  if (!treeSha) throw new Error("github-tree-not-found");
  const treeUrl = new URL(githubApiUrl(`/git/trees/${treeSha}`));
  treeUrl.searchParams.set("recursive", "1");
  const tree = await requestGithub(treeUrl);
  if (tree.truncated) throw new Error("github-tree-truncated");
  const files = (Array.isArray(tree.tree) ? tree.tree : [])
    .filter((entry) => entry.type === "blob")
    .map((entry) => ({ githubPath: entry.path, relativePath: safeRemoteRelativePath(entry.path), sha: entry.sha }))
    .filter((entry) => entry.relativePath);
  if (!files.length) throw new Error("github-project-empty");
  return files;
}

function assertInsideRoot(targetPath) {
  const relativePath = path.relative(ROOT_DIR, targetPath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("unsafe-update-path");
  }
}

async function downloadRemoteProjectFiles(files, ref = UPDATE_BRANCH) {
  const downloaded = [];
  for (const file of files) {
    const buffer = await requestGithub(githubRawUrl(file.githubPath, ref), {
      json: false,
      headers: { Accept: "application/octet-stream" },
    });
    if (file.sha && gitBlobSha(buffer) !== file.sha) {
      throw new Error(`download-sha-mismatch:${file.relativePath}`);
    }
    downloaded.push({ ...file, buffer });
  }
  return downloaded;
}

async function listLocalProjectFiles(baseDir = ROOT_DIR, prefix = "") {
  const entries = await readdir(baseDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const rootName = relativePath.split("/")[0];
    if (PRESERVED_UPDATE_DIRS.has(rootName) || PRESERVED_UPDATE_FILES.has(relativePath)) continue;
    if (shouldIgnoreLocalProjectPath(relativePath)) continue;
    const absolutePath = path.join(baseDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listLocalProjectFiles(absolutePath, relativePath));
      continue;
    }
    if (entry.isFile() || entry.isSymbolicLink()) {
      files.push(relativePath);
    }
  }
  return files;
}

async function removeStaleProjectFiles(remoteFiles) {
  const localFiles = await listLocalProjectFiles();
  await Promise.all(
    localFiles
      .filter((relativePath) => !remoteFiles.has(relativePath))
      .map(async (relativePath) => {
        const targetPath = path.join(ROOT_DIR, ...relativePath.split("/"));
        assertInsideRoot(targetPath);
        await rm(targetPath, { force: true });
      }),
  );
}

async function writeDownloadedProjectFiles(files) {
  for (const file of files) {
    const targetPath = path.join(ROOT_DIR, ...file.relativePath.split("/"));
    assertInsideRoot(targetPath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, file.buffer);
  }
}

async function installDependencies() {
  const command = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npm";
  const args = process.platform === "win32" ? ["/d", "/s", "/c", "npm install"] : ["install"];
  updateLog("Ejecutando npm install");
  const { stdout, stderr } = await execFile(command, args, {
    cwd: ROOT_DIR,
    timeout: 180000,
    maxBuffer: 2 * 1024 * 1024,
  });
  return { stdout: stdout.slice(-4000), stderr: stderr.slice(-4000) };
}

export async function applyRepositoryUpdate() {
  if (updateInProgress) throw new Error("update-in-progress");
  updateInProgress = true;
  try {
    updateLog("Buscando actualizacion en GitHub", { repo: `${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}`, branch: UPDATE_BRANCH });
    const status = await getUpdateStatus();
    if (!status.remoteCommit) throw new Error("remote-version-not-found");
    if (!status.available) {
      updateLog("LibrePOS ya esta actualizado", {
        localCommit: status.localCommit,
        remoteCommit: status.remoteCommit,
      });
      return { ...status, updated: false, filesUpdated: 0, installRan: false, restartRequired: false };
    }

    return await applyGithubRepositoryUpdate(status);
  } catch (error) {
    updateLog("Error al actualizar LibrePOS", { error: compactError(error) });
    throw error;
  } finally {
    updateInProgress = false;
  }
}

async function applyGithubRepositoryUpdate(status) {
  updateLog("Actualizacion iniciada", {
    localCommit: status.localCommit,
    remoteCommit: status.remoteCommit,
    remoteUrl: status.remoteUrl,
  });
  const remoteFiles = await fetchRemoteProjectFiles(status.remoteCommit);
  updateLog("Lista de archivos recibida desde GitHub", { files: remoteFiles.length });
  const downloadedFiles = await downloadRemoteProjectFiles(remoteFiles, status.remoteCommit);
  updateLog("Archivos descargados desde GitHub", { files: downloadedFiles.length });
  const remoteFileSet = new Set(downloadedFiles.map((file) => file.relativePath));
  await removeStaleProjectFiles(remoteFileSet);
  updateLog("Archivos obsoletos removidos");
  await writeDownloadedProjectFiles(downloadedFiles);
  updateLog("Archivos nuevos escritos");
  await writeLocalAppVersion(status.remoteCommit);
  let installResult = { stdout: "", stderr: "" };
  let installError = "";
  try {
    installResult = await installDependencies();
  } catch (error) {
    installError = compactError(error);
    updateLog("npm install fallo despues de escribir archivos", { error: installError });
  }
  updateLog("Actualizacion completada. Cierra y abre LibrePOS para cargar la nueva version.", {
    remoteCommit: status.remoteCommit,
  });
  return {
    ...status,
    updated: true,
    filesUpdated: downloadedFiles.length,
    installRan: true,
    installError,
    installLog: installResult.stderr || installResult.stdout,
    restartRequired: true,
    updatedAt: new Date().toISOString(),
  };
}

export function createSyncMiddleware() {
  return async function syncMiddleware(req, res, next) {
    const url = new URL(req.url || "/", "http://localhost");
    if (!url.pathname.startsWith("/api/")) {
      await setAccessCookie(res);
      next();
      return;
    }

    if (req.headers.origin && requestOriginAllowed(req)) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      if (await requireAccess(req, res)) {
        res.statusCode = 204;
        res.end();
      }
      return;
    }

    try {
      if (!(await requireAccess(req, res))) return;

      if (url.pathname === "/api/access-info" && req.method === "GET") {
        sendJson(res, 200, lanAccessUrls(req));
        return;
      }

      if (url.pathname === "/api/printers" && req.method === "GET") {
        if (!(await requireAdminUser(res, url.searchParams.get("userId")))) return;
        sendJson(res, 200, await listSystemPrinters());
        return;
      }

      if (url.pathname === "/api/printers/test" && req.method === "POST") {
        const rawBody = await readBody(req);
        const payload = rawBody ? JSON.parse(rawBody) : {};
        if (!(await requireAdminUser(res, String(payload.userId || "")))) return;
        try {
          sendJson(res, 200, await printTestTicket(payload.printerName));
        } catch (error) {
          sendJson(res, 500, { error: "printer-print-failed", detail: compactError(error) });
        }
        return;
      }

      if (url.pathname === "/api/printers/test-legacy" && req.method === "POST") {
        const rawBody = await readBody(req);
        const payload = rawBody ? JSON.parse(rawBody) : {};
        if (!(await requireAdminUser(res, String(payload.userId || "")))) return;
        try {
          sendJson(res, 200, await printLegacyTestTicket(payload.printerName));
        } catch (error) {
          sendJson(res, 500, { error: "printer-legacy-print-failed", detail: compactError(error) });
        }
        return;
      }

      if (url.pathname === "/api/printers/fake-receipt" && req.method === "GET") {
        if (!(await requireAdminUser(res, url.searchParams.get("userId")))) return;
        sendJson(res, 200, previewFakeReceiptTicket(url.searchParams.get("type")));
        return;
      }

      if (url.pathname === "/api/printers/fake-receipt/print" && req.method === "POST") {
        const rawBody = await readBody(req);
        const payload = rawBody ? JSON.parse(rawBody) : {};
        if (!(await requireAdminUser(res, String(payload.userId || "")))) return;
        try {
          sendJson(res, 200, await printFakeReceiptTicket(payload.printerName, payload.ticketText, {
            marginMm: payload.marginMm,
            marginLeftMm: payload.marginLeftMm,
            marginRightMm: payload.marginRightMm,
            logoDataUrl: payload.logoDataUrl,
            logoWidthMm: payload.logoWidthMm,
            type: payload.type,
          }));
        } catch (error) {
          sendJson(res, 500, { error: "printer-fake-receipt-failed", detail: compactError(error) });
        }
        return;
      }

      if (url.pathname === "/api/printers/receipt-header/print" && req.method === "POST") {
        const rawBody = await readBody(req);
        const payload = rawBody ? JSON.parse(rawBody) : {};
        if (!(await requireAdminUser(res, String(payload.userId || "")))) return;
        try {
          sendJson(res, 200, await printReceiptHeaderTicket(payload.printerName, {
            marginMm: payload.marginMm,
            marginLeftMm: payload.marginLeftMm,
            marginRightMm: payload.marginRightMm,
            logoDataUrl: payload.logoDataUrl,
            logoWidthMm: payload.logoWidthMm,
            includeLogo: payload.includeLogo,
            logoPosition: payload.logoPosition,
          }));
        } catch (error) {
          sendJson(res, 500, { error: "printer-header-print-failed", detail: compactError(error) });
        }
        return;
      }

      if (url.pathname === "/api/printers/logo/print" && req.method === "POST") {
        const rawBody = await readBody(req);
        const payload = rawBody ? JSON.parse(rawBody) : {};
        if (!(await requireAdminUser(res, String(payload.userId || "")))) return;
        try {
          sendJson(res, 200, await printLogoTestTicket(payload.printerName, {
            marginMm: payload.marginMm,
            marginLeftMm: payload.marginLeftMm,
            marginRightMm: payload.marginRightMm,
            logoDataUrl: payload.logoDataUrl,
            logoWidthMm: payload.logoWidthMm,
          }));
        } catch (error) {
          sendJson(res, 500, { error: "printer-logo-print-failed", detail: compactError(error) });
        }
        return;
      }

      if (url.pathname === "/api/printers/sale-receipt/print" && req.method === "POST") {
        const rawBody = await readBody(req);
        const payload = rawBody ? JSON.parse(rawBody) : {};
        if (!(await requireCashUser(res, String(payload.userId || "")))) return;
        try {
          sendJson(res, 200, await printSaleReceiptTicket(payload.printerName, payload.ticketText, {
            marginMm: payload.marginMm,
            marginLeftMm: payload.marginLeftMm,
            marginRightMm: payload.marginRightMm,
            logoDataUrl: payload.logoDataUrl,
            logoWidthMm: payload.logoWidthMm,
          }));
        } catch (error) {
          sendJson(res, 500, { error: "printer-sale-receipt-failed", detail: compactError(error) });
        }
        return;
      }

      if (url.pathname === "/api/printers/order-receipt/print" && req.method === "POST") {
        const rawBody = await readBody(req);
        const payload = rawBody ? JSON.parse(rawBody) : {};
        if (!(await requirePrinterUser(res, String(payload.userId || "")))) return;
        try {
          sendJson(res, 200, await printSaleReceiptTicket(payload.printerName, payload.ticketText, {
            marginMm: payload.marginMm,
            marginLeftMm: payload.marginLeftMm,
            marginRightMm: payload.marginRightMm,
            logoDataUrl: payload.logoDataUrl,
            logoWidthMm: payload.logoWidthMm,
          }));
        } catch (error) {
          sendJson(res, 500, { error: "printer-receipt-failed", detail: compactError(error) });
        }
        return;
      }

      if (url.pathname === "/api/printers/command/print" && req.method === "POST") {
        const rawBody = await readBody(req);
        const payload = rawBody ? JSON.parse(rawBody) : {};
        if (!(await requirePrinterUser(res, String(payload.userId || "")))) return;
        try {
          sendJson(res, 200, await printSaleReceiptTicket(payload.printerName, payload.ticketText, {
            marginMm: payload.marginMm,
            marginLeftMm: payload.marginLeftMm,
            marginRightMm: payload.marginRightMm,
          }));
        } catch (error) {
          sendJson(res, 500, { error: "printer-command-failed", detail: compactError(error) });
        }
        return;
      }

      if (url.pathname === "/api/printers/remove" && req.method === "POST") {
        const rawBody = await readBody(req);
        const payload = rawBody ? JSON.parse(rawBody) : {};
        if (!(await requireAdminUser(res, String(payload.userId || "")))) return;
        try {
          sendJson(res, 200, await removeSystemPrinter(payload.printerName));
        } catch (error) {
          sendJson(res, 500, { error: "printer-remove-failed", detail: compactError(error) });
        }
        return;
      }

      if (url.pathname === "/api/update/status" && req.method === "GET") {
        sendJson(res, 200, await getUpdateStatus());
        return;
      }

      if (url.pathname === "/api/update/apply" && req.method === "POST") {
        if (updateInProgress) {
          sendJson(res, 409, { error: "update-in-progress" });
          return;
        }
        sendJson(res, 200, await applyRepositoryUpdate());
        return;
      }

      if (url.pathname === "/api/login" && req.method === "POST") {
        await loadSharedState();
        if (!sharedState) {
          sendJson(res, 404, { error: "state-not-ready" });
          return;
        }
        const rawBody = await readBody(req);
        const payload = rawBody ? JSON.parse(rawBody) : {};
        const username = cleanUsername(payload.username);
        const password = String(payload.password || "");
        const user = (sharedState?.users || []).find((item) => item.active !== false && sameUsername(item.username, username));
        if (!verifyPassword(user, password)) {
          sendJson(res, 401, { error: "invalid-login" });
          return;
        }
        if (user.password) {
          const normalized = normalizeStateForStorage(sharedState);
          sharedState = normalized.state;
          await writeStateFile();
        }
        sendJson(res, 200, { userId: user.id, version: sharedVersion, state: publicState(sharedState) });
        return;
      }

      if (url.pathname === "/api/state" && req.method === "GET") {
        await loadSharedState();
        sendJson(res, 200, { version: sharedVersion, state: publicState(sharedState) });
        return;
      }

      if (url.pathname === "/api/state" && req.method === "POST") {
        await loadSharedState();
        const rawBody = await readBody(req);
        const payload = rawBody ? JSON.parse(rawBody) : {};
        const validationError = validateStatePayload(payload.state);
        if (validationError) {
          sendJson(res, 400, { error: validationError });
          return;
        }
        const baseVersion = Number(payload.baseVersion);
        if (!Number.isFinite(baseVersion)) {
          sendJson(res, 400, { error: "missing-base-version", version: sharedVersion, state: publicState(sharedState) });
          return;
        }
        if (baseVersion !== sharedVersion) {
          sendJson(res, 409, { error: "version-mismatch", version: sharedVersion, state: publicState(sharedState) });
          return;
        }
        const saved = await saveSharedState(payload.state, String(payload.clientId || ""));
        sendJson(res, 200, saved);
        return;
      }

      if (url.pathname === "/api/events" && req.method === "GET") {
        await loadSharedState();
        res.writeHead(200, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        });
        res.write(`event: hello\ndata: ${JSON.stringify({ version: sharedVersion, state: publicState(sharedState) })}\n\n`);
        const heartbeat = setInterval(() => {
          try {
            res.write(`event: ping\ndata: ${Date.now()}\n\n`);
          } catch {
            clearInterval(heartbeat);
            clients.delete(res);
          }
        }, 20000);
        clients.add(res);
        req.on("close", () => {
          clearInterval(heartbeat);
          clients.delete(res);
        });
        return;
      }

      sendJson(res, 404, { error: "not-found" });
    } catch (error) {
      sendJson(res, 500, { error: error?.message || "sync-error" });
    }
  };
}

import { applyRepositoryUpdate, getUpdateStatus } from "../sync-store.js";

try {
  console.log("[LibrePOS update] Comprobando GitHub...");
  const status = await getUpdateStatus();
  console.log(`[LibrePOS update] Local: ${status.localCommit || "desconocido"}`);
  console.log(`[LibrePOS update] GitHub: ${status.remoteCommit || "desconocido"}`);

  if (!status.available) {
    console.log("[LibrePOS update] No hay actualizaciones disponibles.");
    process.exit(0);
  }

  const result = await applyRepositoryUpdate();
  if (result.updated) {
    console.log("[LibrePOS update] Actualizacion aplicada.");
    console.log("[LibrePOS update] Cierra y abre LibrePOS para cargar la nueva version.");
  } else {
    console.log("[LibrePOS update] LibrePOS ya estaba actualizado.");
  }
} catch (error) {
  console.error(`[LibrePOS update] Error: ${error?.message || error}`);
  process.exit(1);
}

#!/usr/bin/env python3
from pathlib import Path
import socket
import subprocess
import sys
import time
import webbrowser


ROOT = Path(__file__).resolve().parents[1]


def run(command):
    print("$ " + " ".join(command))
    subprocess.run(command, cwd=ROOT, check=True)


def lan_ips():
    found = []
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None):
            address = info[4][0]
            if "." in address and not address.startswith("127.") and address not in found:
                found.append(address)
    except OSError:
        pass

    if not found:
        try:
            probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            probe.connect(("8.8.8.8", 80))
            found.append(probe.getsockname()[0])
            probe.close()
        except OSError:
            pass

    return found


def ensure_installed():
    if (ROOT / "node_modules").exists():
        return
    print("No se encontro node_modules. Instalando dependencias...")
    run(["npm", "install"])


def main():
    print("LibrePOS - servidor local")
    print(f"Carpeta: {ROOT}")
    ensure_installed()

    print("\nURLs:")
    print("  PC local: http://localhost:5173/")
    for ip in lan_ips():
        print(f"  WiFi:     http://{ip}:5173/")

    process = subprocess.Popen(["npm", "start"], cwd=ROOT)
    time.sleep(2)
    webbrowser.open("http://localhost:5173/")
    print("\nServidor iniciado. Deja esta ventana abierta mientras uses LibrePOS.")
    print("Para detenerlo, cierra la ventana o pulsa Ctrl+C.")

    try:
        return process.wait()
    except KeyboardInterrupt:
        process.terminate()
        return 0


if __name__ == "__main__":
    sys.exit(main())

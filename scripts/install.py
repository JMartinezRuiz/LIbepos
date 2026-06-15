#!/usr/bin/env python3
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import webbrowser


ROOT = Path(__file__).resolve().parents[1]


def command_exists(name):
    return shutil.which(name) is not None


def run(command):
    print("$ " + " ".join(command))
    subprocess.run(command, cwd=ROOT, check=True)


def pause():
    try:
        input("\nPulsa Enter para cerrar...")
    except EOFError:
        pass


def ensure_node():
    if command_exists("node") and command_exists("npm"):
        return

    print("No se encontro Node.js/npm.")
    print("LibrePOS necesita Node.js LTS para instalar dependencias y arrancar el servidor local.")

    if platform.system() == "Darwin" and command_exists("brew"):
        print("Homebrew detectado. Instalando Node.js con brew...")
        run(["brew", "install", "node"])
        return

    print("Se abrira la pagina oficial de Node.js. Instala la version LTS y vuelve a ejecutar este instalador.")
    webbrowser.open("https://nodejs.org/")
    pause()
    sys.exit(1)


def main():
    print("LibrePOS - instalador")
    print(f"Carpeta: {ROOT}")
    ensure_node()
    run(["npm", "install"])
    run(["npm", "run", "build"])
    print("\nInstalacion completada.")
    print("Ahora abre 'Abrir LibrePOS.command' en macOS o 'Abrir LibrePOS.bat' en Windows.")
    pause()


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        print(f"\nError ejecutando: {' '.join(error.cmd)}")
        pause()
        sys.exit(error.returncode)

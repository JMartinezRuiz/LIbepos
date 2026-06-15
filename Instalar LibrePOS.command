#!/bin/bash
cd "$(dirname "$0")"

if command -v python3 >/dev/null 2>&1; then
  python3 scripts/install.py
else
  echo "No se encontro Python 3. Usando instalacion directa con npm."
  if ! command -v npm >/dev/null 2>&1; then
    echo "No se encontro Node.js/npm. Se abrira la pagina oficial de Node.js."
    open "https://nodejs.org/"
    read -r -p "Instala Node.js LTS y vuelve a abrir este instalador. Pulsa Enter para cerrar..."
    exit 1
  fi
  npm install
  npm run build
  read -r -p "Instalacion completada. Pulsa Enter para cerrar..."
fi

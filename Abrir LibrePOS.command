#!/bin/bash
cd "$(dirname "$0")"

if command -v python3 >/dev/null 2>&1; then
  python3 scripts/start.py
else
  echo "No se encontro Python 3. Arrancando directamente con npm."
  if ! command -v npm >/dev/null 2>&1; then
    echo "No se encontro Node.js/npm. Se abrira la pagina oficial de Node.js."
    open "https://nodejs.org/"
    read -r -p "Instala Node.js LTS y vuelve a abrir este lanzador. Pulsa Enter para cerrar..."
    exit 1
  fi
  if [ ! -d "node_modules" ]; then
    npm install
  fi
  open "http://localhost:5173/"
  npm start
fi

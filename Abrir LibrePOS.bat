@echo off
cd /d "%~dp0"

echo LibrePOS - servidor local para Windows
echo.
where npm >nul 2>nul
if not %errorlevel%==0 (
  echo No se encontro Node.js/npm. Se abrira la pagina oficial de Node.js.
  start https://nodejs.org/
  pause
  goto end
)
if not exist node_modules (
  call npm install
  if not %errorlevel%==0 goto npm_error
)

echo.
echo Abriendo http://localhost:5173/
echo Deja esta ventana abierta mientras uses LibrePOS.
echo Para detenerlo, cierra la ventana o pulsa Ctrl+C.
echo.
start "" http://localhost:5173/
call npm start
goto end

:npm_error
echo.
echo Hubo un error arrancando LibrePOS. Revisa el mensaje anterior.
pause

:end

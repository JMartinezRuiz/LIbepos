@echo off
cd /d "%~dp0"

echo LibrePOS - instalador para Windows
echo.
where npm >nul 2>nul
if not %errorlevel%==0 (
  echo No se encontro Node.js/npm. Se abrira la pagina oficial de Node.js.
  start https://nodejs.org/
  pause
  goto end
)

call npm install
if not %errorlevel%==0 goto npm_error

call npm run build
if not %errorlevel%==0 goto npm_error

echo.
echo Instalacion completada. Ahora abre "Abrir LibrePOS.bat".
pause
goto end

:npm_error
echo.
echo Hubo un error instalando LibrePOS. Revisa el mensaje anterior.
pause

:end

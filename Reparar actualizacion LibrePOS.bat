@echo off
cd /d "%~dp0"

echo LibrePOS - reparador de actualizacion
echo.
where powershell >nul 2>nul
if not %errorlevel%==0 (
  echo No se encontro PowerShell.
  pause
  goto end
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\repair-update.ps1"
echo.
pause

:end

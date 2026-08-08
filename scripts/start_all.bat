@echo off
setlocal EnableExtensions
echo ========================================
echo  Iniciando Sistema de Catalogos
echo ========================================
echo.
echo  Backend:  http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo  Frontend: http://localhost:4200
echo.
echo ========================================
echo.

start "Backend - Sistema de Catalogos" cmd /k "%~dp0start_backend.bat"
timeout /t 3 /nobreak >nul
start "Frontend - Sistema de Catalogos" cmd /k "%~dp0start_frontend.bat"

echo.
echo Ambos servicios se estan iniciando en ventanas separadas.
echo Para detenerlos ejecute: scripts\stop_all.bat
echo.
pause

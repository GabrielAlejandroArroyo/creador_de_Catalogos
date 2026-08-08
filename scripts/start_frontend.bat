@echo off
title Frontend - Sistema de Catalogos
cd /d "%~dp0..\frontend"

if not exist "node_modules" (
    echo Instalando dependencias npm...
    npm install --install-strategy=nested
)

echo.
echo ========================================
echo  Frontend iniciando en http://localhost:4200
echo ========================================
echo.

npx ng serve --port 4200 --open

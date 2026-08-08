@echo off
title Backend - Sistema de Catalogos
cd /d "%~dp0..\backend"

if not exist ".venv" (
    echo Creando entorno virtual...
    python -m venv .venv
)

echo Activando entorno virtual...
call .venv\Scripts\activate.bat

echo Instalando dependencias...
pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt --quiet

echo.
echo ========================================
echo  Backend iniciando en http://localhost:8000
echo  Docs en http://localhost:8000/docs
echo ========================================
echo.

uvicorn app.main:app --reload --port 8000

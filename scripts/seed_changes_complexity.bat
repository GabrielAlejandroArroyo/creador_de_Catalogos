@echo off
title Seed Cambios y Complejidades
cd /d "%~dp0..\backend"

if not exist ".venv" (
    echo Creando entorno virtual...
    python -m venv .venv
)

call .venv\Scripts\activate.bat
pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt --quiet

echo.
python seed_changes_complexity.py
echo.
pause

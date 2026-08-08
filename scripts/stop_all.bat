@echo off
setlocal EnableExtensions
echo ========================================
echo  Deteniendo Sistema de Catalogos
echo ========================================
echo.
echo Esto cierra lo iniciado por start_all.bat
echo (ventanas Backend/Frontend y puertos 8000/4200).
echo.

REM 1) Matar ventanas CMD abiertas por start_all.bat (+ arbol de hijos)
call :kill_window "Backend - Sistema de Catalogos*"
call :kill_window "Frontend - Sistema de Catalogos*"
call :kill_window "Backend*"
call :kill_window "Frontend*"

REM 2) Liberar puertos del backend/frontend (uvicorn --reload, ng serve, node)
call :kill_port 8000
call :kill_port 4200

REM 3) Remanentes tipicos
taskkill /F /IM uvicorn.exe >nul 2>&1

echo.
echo Servicios detenidos.
echo.
pause
exit /b 0

:kill_window
set "TITLE=%~1"
echo Cerrando ventanas: %TITLE%
taskkill /F /T /FI "WINDOWTITLE eq %TITLE%" >nul 2>&1
exit /b 0

:kill_port
set "PORT=%~1"
echo Liberando puerto %PORT%...
powershell -NoProfile -Command ^
  "$conns = Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue;" ^
  "if (-not $conns) { exit 0 };" ^
  "$ids = $conns | Select-Object -ExpandProperty OwningProcess -Unique;" ^
  "foreach ($procId in $ids) {" ^
  "  if ($procId -and $procId -ne 0) {" ^
  "    Write-Host ('  - PID ' + $procId);" ^
  "    & taskkill.exe /F /T /PID $procId 2>$null | Out-Null;" ^
  "  }" ^
  "}"
if errorlevel 1 (
  for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    if not "%%P"=="0" (
      echo   - PID %%P
      taskkill /F /T /PID %%P >nul 2>&1
    )
  )
)
exit /b 0

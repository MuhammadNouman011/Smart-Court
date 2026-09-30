@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Smart Court - Stop
color 0C

echo.
echo   ============================================================
echo                  Stopping Smart Court services...
echo   ============================================================
echo.

set "killed=0"

REM Kill backend (port 8000)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 " ^| findstr "LISTENING"') do (
  echo   Stopping backend  ^(PID %%a^)...
  taskkill /F /PID %%a >nul 2>&1
  set /a killed+=1
)

REM Kill frontend (port 5173)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " ^| findstr "LISTENING"') do (
  echo   Stopping frontend ^(PID %%a^)...
  taskkill /F /PID %%a >nul 2>&1
  set /a killed+=1
)

REM Close labeled cmd windows opened by START-SMART-COURT.bat
taskkill /F /FI "WINDOWTITLE eq Smart Court - Backend*"  >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Smart Court - Frontend*" >nul 2>&1

echo.
if !killed! GEQ 1 (
  echo   Done. ^(Ollama left running so you can use it for other things.^)
) else (
  echo   Nothing was running on ports 8000 or 5173.
)
echo.
timeout /t 4 /nobreak >nul
exit /b 0

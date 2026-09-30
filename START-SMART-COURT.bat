@echo off
REM ============================================================
REM  Smart Court - ONE CLICK. Just double-click this file.
REM  Installs everything that is missing (Python, Node.js,
REM  Ollama, AI model, packages) and then opens the app.
REM ============================================================
title Smart Court
color 0B
cd /d "%~dp0"

if not exist "%~dp0scripts\smartcourt.ps1" (
  color 0C
  echo.
  echo   The project files were not found next to this file.
  echo   If you opened it from inside a ZIP: right-click the ZIP, choose "Extract All",
  echo   then open the extracted folder and double-click START-SMART-COURT.bat again.
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "Unblock-File -LiteralPath '%~dp0scripts\smartcourt.ps1'" >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\smartcourt.ps1"

if errorlevel 1 (
  color 0C
  echo.
  echo   Something went wrong. Check your internet connection and double-click this file again.
  echo   Log file: setup-log.txt
)
echo.
pause

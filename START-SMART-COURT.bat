@echo off
REM ============================================================
REM  Smart Court - ONE CLICK. Just double-click this file.
REM  Installs everything that is missing (Python, Node.js,
REM  Ollama, AI model, packages) and then opens the app.
REM ============================================================
title Smart Court
color 0B
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -LiteralPath '%~dp0' -Recurse -Include *.ps1,*.bat | Unblock-File" >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\smartcourt.ps1"

if errorlevel 1 (
  color 0C
  echo.
  echo   Something went wrong. Check your internet connection and double-click this file again.
  echo   Log file: setup-log.txt
)
echo.
pause

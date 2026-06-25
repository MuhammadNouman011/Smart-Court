@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Smart Court - Setup
color 0B

cls
echo.
echo   ============================================================
echo                S M A R T   C O U R T   -   S E T U P
echo   ============================================================
echo.
echo   This will:
echo     1. Verify Python, Node and Ollama are installed
echo     2. Pull the AI model llama3.2:3b ^(2 GB^)
echo     3. Create a Python virtual environment + install deps
echo     4. Install frontend npm modules
echo     5. Copy .env from .env.example
echo.
echo   Total time: about 10 minutes on a normal connection.
echo.
pause

echo.
echo   [1/5] Checking installed tools...
echo.

set "missing=0"

where python >nul 2>&1
if errorlevel 1 (
  echo     [X] Python NOT FOUND. Get it from https://python.org/downloads
  set /a missing+=1
) else (
  for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo     [OK] %%v
)

where node >nul 2>&1
if errorlevel 1 (
  echo     [X] Node.js NOT FOUND. Get it from https://nodejs.org
  set /a missing+=1
) else (
  for /f "tokens=*" %%v in ('node --version 2^>^&1') do echo     [OK] Node %%v
)

where ollama >nul 2>&1
if errorlevel 1 (
  echo     [X] Ollama NOT FOUND. Get it from https://ollama.com/download
  set /a missing+=1
) else (
  for /f "tokens=*" %%v in ('ollama --version 2^>^&1') do echo     [OK] %%v
)

if !missing! GEQ 1 (
  color 0C
  echo.
  echo   Please install the missing tools and run this again.
  echo.
  pause
  exit /b 1
)

echo.
echo   [2/5] Pulling the AI model llama3.2:3b...
ollama list 2>nul | findstr /C:"llama3.2:3b" >nul
if errorlevel 1 (
  ollama pull llama3.2:3b
) else (
  echo     Already pulled. Skipping.
)

echo.
echo   [3/5] Creating Python virtual environment + installing backend deps...
pushd "%~dp0backend"
if not exist .venv (
  python -m venv .venv
)
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
popd

echo.
echo   [4/5] Installing frontend npm modules...
pushd "%~dp0frontend"
call npm install --no-audit --no-fund
popd

echo.
echo   [5/5] Copying .env from template...
pushd "%~dp0backend"
if not exist .env (
  copy .env.example .env >nul
  echo     Created backend\.env
) else (
  echo     backend\.env already exists. Skipping.
)
popd

echo.
echo   ============================================================
echo                   SETUP COMPLETE.
echo   ============================================================
echo.
echo   You can now double-click start.bat to run Smart Court.
echo.
pause
exit /b 0

@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Smart Court - Launcher
color 0A

cls
echo.
echo   ============================================================
echo                       S M A R T   C O U R T
echo                   Pakistan's AI Legal Co-Pilot
echo   ============================================================
echo.

REM ---------- Prerequisite checks ----------
where python >nul 2>&1
if errorlevel 1 (
  color 0C
  echo   [ERROR] Python is not installed.
  echo           Download Python 3.11 or newer from https://python.org/downloads
  echo           IMPORTANT: tick "Add Python to PATH" during install.
  echo.
  pause & exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  color 0C
  echo   [ERROR] Node.js is not installed.
  echo           Download from https://nodejs.org
  echo.
  pause & exit /b 1
)

where ollama >nul 2>&1
if errorlevel 1 (
  color 0C
  echo   [ERROR] Ollama is not installed.
  echo           Download from https://ollama.com/download
  echo.
  pause & exit /b 1
)

echo   [OK] Python, Node and Ollama are installed.
echo.

REM ---------- Backend Python environment ----------
if not exist "%~dp0backend\.venv\Scripts\python.exe" (
  echo   First time setup detected.
  echo   Creating Python environment ^(this takes about 3 minutes^)...
  echo.
  pushd "%~dp0backend"
  python -m venv .venv
  call .venv\Scripts\activate.bat
  python -m pip install --upgrade pip
  pip install -r requirements.txt
  if not exist .env copy .env.example .env >nul
  popd
  echo.
)
echo   [OK] Backend environment ready.

REM ---------- Frontend node_modules ----------
if not exist "%~dp0frontend\node_modules" (
  echo   Installing frontend dependencies ^(about 2 minutes^)...
  echo.
  pushd "%~dp0frontend"
  call npm install --no-audit --no-fund
  popd
  echo.
)
echo   [OK] Frontend dependencies ready.

REM ---------- AI model ----------
ollama list 2>nul | findstr /C:"llama3.2:3b" >nul
if errorlevel 1 (
  echo   Pulling the AI model ^(about 5 minutes, 2 GB^)...
  ollama pull llama3.2:3b
  echo.
)
echo   [OK] AI model ready.

echo.
echo   ============================================================
echo                    Launching all services...
echo   ============================================================
echo.

REM ---------- 1. Ollama ----------
curl -s -o nul -m 2 http://localhost:11434/api/tags
if errorlevel 1 (
  echo   [1/3] Starting Ollama...
  start "Smart Court - Ollama" cmd /k "color 0B && title Smart Court - Ollama && ollama serve"
  timeout /t 4 /nobreak >nul
) else (
  echo   [1/3] Ollama is already running.
)

REM ---------- 2. Backend ----------
echo   [2/3] Starting Backend on port 8000...
start "Smart Court - Backend" cmd /k "color 0E && title Smart Court - Backend && cd /d %~dp0backend && call .venv\Scripts\activate.bat && uvicorn main:app --host 0.0.0.0 --port 8000"

REM ---------- 3. Frontend ----------
echo   [3/3] Starting Frontend on port 5173...
start "Smart Court - Frontend" cmd /k "color 0A && title Smart Court - Frontend && cd /d %~dp0frontend && npm run dev"

echo.
echo   Waiting for the backend to come online...
set /a tries=0
:wait_backend
timeout /t 2 /nobreak >nul
curl -s -o nul -m 2 http://localhost:8000/health
if errorlevel 1 (
  set /a tries+=1
  if !tries! GEQ 30 (
    color 0C
    echo   Backend did not respond after 60 seconds.
    echo   Check the "Smart Court - Backend" window for errors.
    pause
    exit /b 1
  )
  goto wait_backend
)
echo   [OK] Backend is responding.

echo.
echo   Opening the app in your browser...
timeout /t 2 /nobreak >nul
start "" http://localhost:5173

echo.
echo   ============================================================
echo                EVERYTHING IS RUNNING.  ENJOY.
echo   ============================================================
echo.
echo     App:           http://localhost:5173
echo     API docs:      http://localhost:8000/api/docs
echo.
echo     To stop:       run stop.bat  ^(or close the 3 windows^)
echo.
pause
exit /b 0

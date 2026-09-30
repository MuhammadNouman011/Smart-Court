# Smart Court - one-click installer + launcher.
# Called by "START-SMART-COURT.bat". Installs anything missing (Python 3.11,
# Node.js, Ollama, the AI model, all Python/npm packages), then starts the app.
# Safe to run again: everything already installed is skipped.
param(
    [switch]$NoLaunch   # set up everything but do not start the servers
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor 3072

$Root     = Split-Path -Parent $PSScriptRoot
$Backend  = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend'
$Runtime  = Join-Path $Root '.runtime'
$Dl       = Join-Path $env:TEMP 'SmartCourtSetup'
$LogFile  = Join-Path $Root 'setup-log.txt'

New-Item -ItemType Directory -Force -Path $Runtime, $Dl | Out-Null
try { Start-Transcript -Path $LogFile -Append | Out-Null } catch {}

# ------------------------------------------------------------------ helpers

function Say([string]$msg, [string]$color = 'Gray') { Write-Host "  $msg" -ForegroundColor $color }
function Ok([string]$msg)   { Say "[OK] $msg" 'Green' }
function Warn([string]$msg) { Say "[!]  $msg" 'Yellow' }
function Step([string]$msg) {
    Write-Host ''
    Write-Host "  >>> $msg" -ForegroundColor Cyan
}
function Fail([string]$msg) {
    Write-Host ''
    Say "[X] $msg" 'Red'
    Say "Details are saved in: $LogFile" 'Red'
    try { Stop-Transcript | Out-Null } catch {}
    exit 1
}

# Runs a native command, streams its output, returns its exit code.
function Invoke-Native([scriptblock]$Block) {
    $old = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { & $Block | Out-Host; return $LASTEXITCODE }
    catch { Write-Host $_; return 1 }
    finally { $ErrorActionPreference = $old }
}

function Get-File([string]$Url, [string]$OutFile) {
    if (Test-Path $OutFile) { Remove-Item $OutFile -Force }
    for ($i = 1; $i -le 3; $i++) {
        $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
        if ($curl) {
            $code = Invoke-Native { & curl.exe -L --fail --retry 3 --progress-bar -o $OutFile $Url }
        } else {
            try { Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing; $code = 0 } catch { $code = 1 }
        }
        if ($code -eq 0 -and (Test-Path $OutFile) -and (Get-Item $OutFile).Length -gt 0) { return }
        Warn "Download failed (attempt $i of 3), retrying..."
        Start-Sleep -Seconds 3
    }
    Fail "Could not download $Url - check your internet connection and run again."
}

function Test-Url([string]$Url) {
    try { Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 | Out-Null; return $true }
    catch { return $false }
}

function Get-FileHashText([string]$Path) {
    if (Test-Path $Path) { return (Get-FileHash -Algorithm SHA256 -Path $Path).Hash }
    return 'none'
}

function Write-Utf8NoBom([string]$Path) {
    process { [IO.File]::WriteAllText($Path, ($_ -replace "`r?`n", "`r`n"), (New-Object Text.UTF8Encoding($false))) }
}

# Deletes a folder even when it contains paths longer than 260 characters.
function Remove-LongPath([string]$Path) {
    if (-not (Test-Path $Path)) { return }
    Invoke-Native { cmd.exe /c "rd /s /q `"\\?\$Path`"" } | Out-Null
    if (Test-Path $Path) { Fail "Could not delete $Path - close any program using it and run again." }
}

function Read-EnvValue([string]$Path, [string]$Key, [string]$Default) {
    if (Test-Path $Path) {
        foreach ($line in Get-Content $Path) {
            if ($line -match "^\s*$Key\s*=\s*(.+?)\s*$") { return $Matches[1] }
        }
    }
    return $Default
}

# ------------------------------------------------------------------ banner

Clear-Host
Write-Host ''
Write-Host '  ============================================================' -ForegroundColor Cyan
Write-Host '                     S M A R T   C O U R T' -ForegroundColor Cyan
Write-Host '                 Pakistan''s AI Legal Co-Pilot' -ForegroundColor Cyan
Write-Host '  ============================================================' -ForegroundColor Cyan
Write-Host ''
Say 'The first run installs everything automatically (20-40 min, ~6 GB download).'
Say 'Please keep this window open until the app opens in your browser.'
Say 'After that, every start takes only 1-2 minutes.'

# Disk space
try {
    $drive = (Get-Item $Root).PSDrive
    $freeGB = [math]::Round($drive.Free / 1GB, 1)
    if ($freeGB -lt 8) { Warn "Only $freeGB GB free on drive $($drive.Name):. About 8 GB is needed." }
} catch {}

# OneDrive-synced folders (Desktop/Documents) lock files while pip/npm write them.
if ($Root -like '*\OneDrive*') {
    Warn 'This folder is inside OneDrive. If installing fails, move the project to C:\SmartCourt and run again.'
}

# RAM
try {
    $ramGB = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)
    if ($ramGB -lt 8) { Warn "This PC has $ramGB GB RAM. The AI will be slow (8 GB+ recommended)." }
} catch {}

# ------------------------------------------------------------------ 1. VC++ runtime

Step '[1/7] Microsoft Visual C++ runtime'
$sys32 = Join-Path $env:windir 'System32'
if ((Test-Path "$sys32\msvcp140.dll") -and (Test-Path "$sys32\vcruntime140_1.dll")) {
    Ok 'Already installed.'
} else {
    Say 'Installing (Windows may ask "Yes/No" - please click YES)...'
    $vc = Join-Path $Dl 'vc_redist.x64.exe'
    Get-File 'https://aka.ms/vs/17/release/vc_redist.x64.exe' $vc
    try {
        Start-Process -FilePath $vc -ArgumentList '/install', '/quiet', '/norestart' -Verb RunAs -Wait
        Ok 'Installed.'
    } catch {
        Warn 'Skipped (permission denied). The app may still work.'
    }
}

# ------------------------------------------------------------------ 2. Python 3.11

Step '[2/7] Python 3.11'

function Test-Python([string]$Exe) {
    if (-not $Exe -or -not (Test-Path $Exe)) { return $false }
    if ($Exe -like '*\WindowsApps\*') { return $false }   # Microsoft Store stub
    try {
        $out = & $Exe -c "import sys,struct;print('%d.%d-%d' % (sys.version_info[0], sys.version_info[1], struct.calcsize('P')*8))" 2>$null
        return ($out -eq '3.11-64')
    } catch { return $false }
}

function Find-Python {
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA 'Programs\Python\Python311\python.exe'),
        (Join-Path $env:ProgramFiles 'Python311\python.exe'),
        'C:\Python311\python.exe'
    )
    foreach ($hive in 'HKCU:', 'HKLM:') {
        $key = "$hive\Software\Python\PythonCore\3.11\InstallPath"
        try {
            $p = Get-ItemProperty -Path $key -ErrorAction Stop
            if ($p.ExecutablePath) { $candidates += $p.ExecutablePath }
            if ($p.'(default)') { $candidates += (Join-Path $p.'(default)' 'python.exe') }
        } catch {}
    }
    $py = Get-Command py.exe -ErrorAction SilentlyContinue
    if ($py) {
        try { $candidates += (& $py.Source -3.11 -c "import sys;print(sys.executable)" 2>$null) } catch {}
    }
    foreach ($c in (Get-Command python.exe -All -ErrorAction SilentlyContinue)) { $candidates += $c.Source }
    foreach ($c in $candidates) { if (Test-Python $c) { return $c } }
    return $null
}

$Python = Find-Python
if (-not $Python) {
    Say 'Python 3.11 not found. Downloading (~25 MB)...'
    $pyInstaller = Join-Path $Dl 'python-3.11.9-amd64.exe'
    Get-File 'https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe' $pyInstaller
    Say 'Installing Python silently (1-2 min)...'
    $pyArgs = '/quiet InstallAllUsers=0 PrependPath=0 Include_test=0 Include_launcher=0 Shortcuts=0 AssociateFiles=0'
    $p = Start-Process -FilePath $pyInstaller -ArgumentList $pyArgs -Wait -PassThru
    $Python = Find-Python
    if (-not $Python) { Fail "Python installation failed (exit code $($p.ExitCode))." }
}
Ok "Python: $Python"

# ------------------------------------------------------------------ 3. Node.js

Step '[3/7] Node.js'

function Test-Node([string]$Exe) {
    if (-not $Exe -or -not (Test-Path $Exe)) { return $false }
    try {
        $v = (& $Exe --version 2>$null)
        if ($v -match '^v(\d+)\.') { return ([int]$Matches[1] -ge 20) }
    } catch {}
    return $false
}

$NodeDir = $null
$portableNode = Join-Path $Runtime 'node'
if (Test-Node (Join-Path $portableNode 'node.exe')) {
    $NodeDir = $portableNode
} else {
    $sysNode = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($sysNode -and (Test-Node $sysNode.Source) -and (Test-Path (Join-Path (Split-Path $sysNode.Source) 'npm.cmd'))) {
        $NodeDir = Split-Path $sysNode.Source
    }
}

if (-not $NodeDir) {
    Say 'Node.js not found. Downloading portable Node.js (~30 MB)...'
    $ver = 'v22.11.0'
    try {
        $idx = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json' -UseBasicParsing -TimeoutSec 20
        $pick = $idx | Where-Object { $_.lts -and ($_.files -contains 'win-x64-zip') -and $_.version -like 'v22.*' } | Select-Object -First 1
        if ($pick) { $ver = $pick.version }
    } catch {}
    $zip = Join-Path $Dl "node-$ver-win-x64.zip"
    Get-File "https://nodejs.org/dist/$ver/node-$ver-win-x64.zip" $zip
    Say 'Extracting...'
    # Extract straight into .runtime and rename, so no deep folder ever has to be deleted
    # (npm's nested folders can exceed Windows' 260-char path limit).
    Remove-LongPath $portableNode
    Remove-LongPath (Join-Path $Runtime "node-$ver-win-x64")
    $tar = Join-Path $sys32 'tar.exe'
    $code = 1
    if (Test-Path $tar) { $code = Invoke-Native { & $tar -xf $zip -C $Runtime } }
    if ($code -ne 0) { Expand-Archive -Path $zip -DestinationPath $Runtime -Force }
    Rename-Item -Path (Join-Path $Runtime "node-$ver-win-x64") -NewName 'node'
    if (-not (Test-Node (Join-Path $portableNode 'node.exe'))) { Fail 'Node.js setup failed.' }
    $NodeDir = $portableNode
}
$env:Path = "$NodeDir;$env:Path"
$Npm = Join-Path $NodeDir 'npm.cmd'
Ok "Node.js $(& (Join-Path $NodeDir 'node.exe') --version): $NodeDir"

# ------------------------------------------------------------------ 4. Ollama + AI model

Step '[4/7] Ollama (local AI engine)'

function Find-Ollama {
    $c = @((Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'), (Join-Path $env:ProgramFiles 'Ollama\ollama.exe'))
    $cmd = Get-Command ollama.exe -ErrorAction SilentlyContinue
    if ($cmd) { $c = @($cmd.Source) + $c }
    foreach ($x in $c) { if ($x -and (Test-Path $x)) { return $x } }
    return $null
}

$Ollama = Find-Ollama
if (-not $Ollama) {
    Say 'Ollama not found. Downloading (~1 GB, this is the biggest download)...'
    $olInstaller = Join-Path $Dl 'OllamaSetup.exe'
    Get-File 'https://ollama.com/download/OllamaSetup.exe' $olInstaller
    Say 'Installing Ollama silently...'
    Start-Process -FilePath $olInstaller -ArgumentList '/VERYSILENT', '/NORESTART', '/SUPPRESSMSGBOXES', '/SP-' -Wait
    $Ollama = Find-Ollama
    if (-not $Ollama) { Fail 'Ollama installation failed.' }
}
Ok "Ollama: $Ollama"

if (-not (Test-Url 'http://127.0.0.1:11434/api/tags')) {
    Say 'Starting Ollama server...'
    Start-Process -FilePath $Ollama -ArgumentList 'serve' -WindowStyle Hidden
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 2
        if (Test-Url 'http://127.0.0.1:11434/api/tags') { $ready = $true; break }
    }
    if (-not $ready) { Fail 'Ollama server did not start.' }
}
Ok 'Ollama server is running.'

# backend\.env (the model name comes from here)
$envFile = Join-Path $Backend '.env'
if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $Backend '.env.example') $envFile
    Ok 'Created backend\.env'
}
$Model = Read-EnvValue $envFile 'OLLAMA_MODEL' 'llama3.2:3b'

Step "[5/7] AI model $Model"
$have = ''
try { $have = (& $Ollama list 2>$null) -join "`n" } catch {}
if ($have -match [regex]::Escape($Model)) {
    Ok 'Already downloaded.'
} else {
    Say 'Downloading the AI model (~2 GB)...'
    $done = $false
    for ($i = 1; $i -le 3 -and -not $done; $i++) {
        if ((Invoke-Native { & $Ollama pull $Model }) -eq 0) { $done = $true } else { Warn "Retry $i..." }
    }
    if (-not $done) { Fail "Could not download the AI model $Model." }
    Ok 'Model ready.'
}

# ------------------------------------------------------------------ 6. Backend packages

Step '[6/7] Backend Python packages'
$venv    = Join-Path $Backend '.venv'
$VenvPy  = Join-Path $venv 'Scripts\python.exe'
$marker  = Join-Path $venv '.smartcourt-installed'
$constraints = Join-Path $Backend 'constraints.txt'
$reqHash = (Get-FileHashText (Join-Path $Backend 'requirements.txt')) + (Get-FileHashText $constraints)

# A .venv copied from another PC points to a Python that does not exist here.
if ((Test-Path $venv) -and -not (Test-Python $VenvPy)) {
    Warn 'Existing .venv is broken or from another PC - rebuilding it.'
    Remove-LongPath $venv
}

# torch/chromadb ship very deep file paths; a project in a long folder path needs
# Windows long-path support or pip fails half-way.
$lp = 0
try { $lp = (Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -ErrorAction Stop).LongPathsEnabled } catch {}
if ($Root.Length -gt 40 -and $lp -ne 1 -and -not (Test-Path $marker)) {
    Say 'Project folder path is long - enabling Windows long paths (click YES if asked)...'
    try {
        Start-Process -FilePath 'reg.exe' -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList `
            'add', 'HKLM\SYSTEM\CurrentControlSet\Control\FileSystem', '/v', 'LongPathsEnabled', '/t', 'REG_DWORD', '/d', '1', '/f'
    } catch {
        Warn 'Could not enable long paths. If install fails, move the project to a short folder like C:\SmartCourt'
    }
}

if ((Test-Path $marker) -and ((Get-Content $marker -Raw).Trim() -eq $reqHash)) {
    Ok 'Already installed.'
} else {
    if (-not (Test-Path $VenvPy)) {
        Say 'Creating virtual environment...'
        if ((Invoke-Native { & $Python -m venv $venv }) -ne 0) { Fail 'Could not create the Python virtual environment.' }
    }
    Say 'Installing packages (~2 GB, 10-20 min - AI libraries are big)...'
    Invoke-Native { & $VenvPy -m pip install --upgrade pip --disable-pip-version-check } | Out-Null
    $ok = $false
    for ($i = 1; $i -le 3 -and -not $ok; $i++) {
        $code = Invoke-Native { & $VenvPy -m pip install -r (Join-Path $Backend 'requirements.txt') -c $constraints --disable-pip-version-check }
        if ($code -eq 0) { $ok = $true } else { Warn "pip failed, retry $i..." }
    }
    if (-not $ok) { Fail 'Installing Python packages failed.' }
    Set-Content -Path $marker -Value $reqHash -Encoding ASCII
    Ok 'Packages installed.'
}

$embMarker = Join-Path $venv '.smartcourt-embeddings'
if (-not (Test-Path $embMarker)) {
    Say 'Downloading the text-embedding model (~90 MB, one time)...'
    $emb = Read-EnvValue $envFile 'EMBEDDING_MODEL' 'sentence-transformers/all-MiniLM-L6-v2'
    $code = Invoke-Native { & $VenvPy -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('$emb')" }
    if ($code -eq 0) { Set-Content -Path $embMarker -Value 'ok' -Encoding ASCII; Ok 'Embedding model ready.' }
    else { Warn 'Could not pre-download it now; the backend will try again on start.' }
}

# ------------------------------------------------------------------ 7. Frontend packages

Step '[7/7] Frontend packages'
$nm       = Join-Path $Frontend 'node_modules'
$nmMarker = Join-Path $nm '.smartcourt-installed'
$lockHash = Get-FileHashText (Join-Path $Frontend 'package-lock.json')
if ((Test-Path $nmMarker) -and ((Get-Content $nmMarker -Raw).Trim() -eq $lockHash) -and (Test-Path (Join-Path $nm '.bin\vite.cmd'))) {
    Ok 'Already installed.'
} else {
    Say 'Running npm install (2-5 min)...'
    Push-Location $Frontend
    $ok = $false
    for ($i = 1; $i -le 3 -and -not $ok; $i++) {
        if ((Invoke-Native { & $Npm install --no-audit --no-fund }) -eq 0) { $ok = $true } else { Warn "npm failed, retry $i..." }
    }
    Pop-Location
    if (-not $ok) { Fail 'npm install failed.' }
    Set-Content -Path $nmMarker -Value $lockHash -Encoding ASCII
    Ok 'Packages installed.'
}

if ($NoLaunch) {
    Write-Host ''
    Ok 'Setup complete (launch skipped).'
    try { Stop-Transcript | Out-Null } catch {}
    exit 0
}

# ------------------------------------------------------------------ launch

Write-Host ''
Write-Host '  ============================================================' -ForegroundColor Cyan
Write-Host '                   Starting Smart Court...' -ForegroundColor Cyan
Write-Host '  ============================================================' -ForegroundColor Cyan

$backendCmd = Join-Path $Runtime 'run-backend.cmd'
@"
@echo off
chcp 65001 >nul
title Smart Court - Backend
color 0E
cd /d "$Backend"
"$VenvPy" -m uvicorn main:app --host 127.0.0.1 --port 8000
echo.
echo   Backend stopped. You can close this window.
pause
"@ | Write-Utf8NoBom $backendCmd

$frontendCmd = Join-Path $Runtime 'run-frontend.cmd'
@"
@echo off
chcp 65001 >nul
title Smart Court - Frontend
color 0A
set "PATH=$NodeDir;%PATH%"
cd /d "$Frontend"
call "$Npm" run dev -- --port 5173 --strictPort
echo.
echo   Frontend stopped. You can close this window.
pause
"@ | Write-Utf8NoBom $frontendCmd

if (Test-Url 'http://127.0.0.1:8000/health') {
    Ok 'Backend already running.'
} else {
    Say 'Starting backend (port 8000)...'
    Start-Process -FilePath 'cmd.exe' -ArgumentList "/c `"$backendCmd`"" -WindowStyle Minimized
}

if (Test-Url 'http://localhost:5173') {
    Ok 'Frontend already running.'
} else {
    Say 'Starting frontend (port 5173)...'
    Start-Process -FilePath 'cmd.exe' -ArgumentList "/c `"$frontendCmd`"" -WindowStyle Minimized
}

Say 'Waiting for the backend to load the AI libraries (first time can take 2-3 min)...'
$up = $false
for ($i = 0; $i -lt 150; $i++) {
    if (Test-Url 'http://127.0.0.1:8000/health') { $up = $true; break }
    Start-Sleep -Seconds 2
}
if (-not $up) { Fail 'Backend did not start. Open the "Smart Court - Backend" window in the taskbar to see the error.' }
Ok 'Backend is running.'

$up = $false
for ($i = 0; $i -lt 60; $i++) {
    if (Test-Url 'http://localhost:5173') { $up = $true; break }
    Start-Sleep -Seconds 2
}
if (-not $up) { Fail 'Frontend did not start. Open the "Smart Court - Frontend" window in the taskbar to see the error.' }
Ok 'Frontend is running.'

Start-Process 'http://localhost:5173'

Write-Host ''
Write-Host '  ============================================================' -ForegroundColor Green
Write-Host '            SMART COURT IS RUNNING - opened in your browser' -ForegroundColor Green
Write-Host '  ============================================================' -ForegroundColor Green
Write-Host ''
Say 'App:       http://localhost:5173'
Say 'API docs:  http://localhost:8000/api/docs'
Say 'To stop:   double-click stop.bat'
Write-Host ''
try { Stop-Transcript | Out-Null } catch {}
exit 0

@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

:: Find Python
set PYTHON=
for %%p in (python py) do (
    where %%p >nul 2>&1
    if !errorlevel! equ 0 set PYTHON=%%p
)
if "!PYTHON!"=="" if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" set PYTHON=%LOCALAPPDATA%\Programs\Python\Python311\python.exe
if "!PYTHON!"=="" if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" set PYTHON=%LOCALAPPDATA%\Programs\Python\Python313\python.exe
if "!PYTHON!"=="" (
    echo Python not found. Install Python and try again.
    pause >nul
    exit /b 1
)

:: Kill old server
for /f "tokens=5" %%a in ('netstat -ano ^| findstr 127.0.0.1:5174 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1

echo.
echo   MoJian Diary - Starting...
echo.

echo Building frontend...
call npx vite build --logLevel silent
if errorlevel 1 (
    echo Build failed!
    pause >nul
    exit /b 1
)

echo Starting server...
start "MoJian" !PYTHON! server.py

echo Waiting for server...
ping -n 4 127.0.0.1 >nul

start "" http://localhost:5174

echo.
echo MoJian is running!
pause >nul
@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

:: Find Python
set PYTHON=
for %%p in (python py python3) do (
    where %%p >nul 2>&1
    if !errorlevel! equ 0 set PYTHON=%%p
)
if "!PYTHON!"=="" if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" set PYTHON=%LOCALAPPDATA%\Programs\Python\Python311\python.exe
if "!PYTHON!"=="" if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" set PYTHON=%LOCALAPPDATA%\Programs\Python\Python313\python.exe
if "!PYTHON!"=="" if exist "C:\Python313\python.exe" set PYTHON=C:\Python313\python.exe
if "!PYTHON!"=="" (
    echo Python not found! Please install Python 3.
    echo Download: https://www.python.org/downloads/
    pause >nul
    exit /b 1
)

:: Kill old server on port 5174
for /f "tokens=5" %%a in ('netstat -ano ^| findstr 127.0.0.1:5174 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1

:: Check if dist folder exists
if not exist "dist\index.html" (
    echo dist folder not found. Please build the frontend first with: npx vite build
    pause >nul
    exit /b 1
)

echo.
echo   MoJian Diary - 墨笺
echo   http://localhost:5174
echo.

start "MoJian" !PYTHON! server.py

echo Waiting for server...
ping -n 3 127.0.0.1 >nul

start "" http://localhost:5174

echo.
echo MoJian is running! Close this window to stop.
pause >nul

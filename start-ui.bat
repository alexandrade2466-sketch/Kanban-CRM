@echo off
title Kanban CRM - Starting...
cd /d "%~dp0"

REM Try common Node.js install locations
if exist "C:\Program Files\nodejs\node.exe" (set "PATH=C:\Program Files\nodejs;%PATH%" & goto :found)
if exist "C:\Program Files (x86)\nodejs\node.exe" (set "PATH=C:\Program Files (x86)\nodejs;%PATH%" & goto :found)
if exist "%LOCALAPPDATA%\Programs\node\node.exe" (set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%" & goto :found)
REM Check nvm-windows
for /d %%D in ("%APPDATA%\nvm\v*") do (
    set "PATH=%%D;%PATH%"
    goto :found
)

:notfound
echo.
echo  [!] Node.js was not found in common locations.
echo.
echo  Quick fix:
echo  1. Download Node.js from https://nodejs.org (LTS version)
echo  2. Run the installer - make sure "Add to PATH" is CHECKED
echo  3. Close this window, then double-click start-ui.bat again
echo.
pause
exit /b 1

:found
echo [*] Node found. Installing dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo [X] npm install failed. Check the errors above.
    pause
    exit /b 1
)

echo.
echo [*] Starting dev server...
echo [*] Opening your browser in a few seconds...
echo [*] Press Ctrl+C in this window to stop the server.
echo.
start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:5173"
call npm run dev
pause

@echo off

echo === ChatArchiver ===
echo.

cd /d "%~dp0"

if not exist "config.json" (
    copy config.example.json config.json
)

if not exist "logs" mkdir logs

if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server
    call npm install
    cd ..
)

if not exist "ui\node_modules" (
    echo Installing ui dependencies...
    cd ui
    call npm install
    cd ..
)

echo Building UI...
cd ui
call npm run build
cd ..

echo Building server...
cd server
call npm run build
cd ..

echo Starting server...
echo Press Ctrl+C to stop
echo.
node server\dist\index.js
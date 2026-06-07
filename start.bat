@echo off
chcp 65001 >nul

echo === ChatArchiver 启动脚本 ===
echo 项目目录: %~dp0
echo.

cd /d "%~dp0"

echo 检查配置文件...
if not exist "config.json" (
    echo 创建默认配置文件...
    copy config.example.json config.json
)

echo 创建日志目录...
if not exist "logs" mkdir logs

echo 检查依赖...
if not exist "server\node_modules" (
    echo 安装 server 依赖...
    cd server
    call npm install
    cd ..
)

if not exist "ui\node_modules" (
    echo 安装 ui 依赖...
    cd ui
    call npm install
    cd ..
)

echo 构建 UI...
cd ui
call npm run build
cd ..

echo 构建服务器...
cd server
call npm run build
cd ..

echo 启动服务器...
echo 按 Ctrl+C 停止服务器
echo.
node server\dist\index.js
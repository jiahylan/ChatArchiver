#!/bin/bash

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== ChatArchiver 启动脚本 ==="
echo "项目目录: $SCRIPT_DIR"
echo ""

# 切换到项目目录
cd "$SCRIPT_DIR"

# 检查配置文件
if [ ! -f "config.json" ]; then
  echo "创建默认配置文件..."
  cp config.example.json config.json
fi

# 从配置文件读取端口
PORT=$(grep -o '"port"[[:space:]]*:[[:space:]]*[0-9]*' config.json | grep -o '[0-9]*')
if [ -z "$PORT" ]; then
  PORT=3000
fi
echo "服务器端口: $PORT"

# 创建日志目录
mkdir -p logs

# 检查是否安装了依赖
if [ ! -d "server/node_modules" ]; then
  echo "安装 server 依赖..."
  cd server && npm install && cd "$SCRIPT_DIR"
fi

if [ ! -d "ui/node_modules" ]; then
  echo "安装 ui 依赖..."
  cd ui && npm install && cd "$SCRIPT_DIR"
fi

# 构建UI
echo "构建 UI..."
cd ui && npm run build && cd "$SCRIPT_DIR"

# 构建服务器
echo "构建服务器..."
cd server && npm run build && cd "$SCRIPT_DIR"

# 停止现有服务器
pkill -f "node.*dist/index.js" 2>/dev/null || true
sleep 1

# 启动服务器（前台运行，Ctrl+C可停止）
echo "启动服务器..."
echo "按 Ctrl+C 停止服务器"
echo ""
node server/dist/index.js
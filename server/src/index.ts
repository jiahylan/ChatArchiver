import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import itemsRouter from './routes/items';
import configRouter from './routes/config';
import { closeDb } from './db';
import { getServerConfig, getDataPath, loadConfig } from './config';

const app = express();
const config = loadConfig();
const serverConfig = config.server;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API路由
app.use('/api/items', itemsRouter);
app.use('/api/config', configRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 获取当前数据路径
app.get('/api/data-path', (req, res) => {
  const dataPath = getDataPath();
  res.json({ 
    path: dataPath,
    exists: fs.existsSync(dataPath)
  });
});

// 静态文件服务 - 提供UI
const uiDistPath = path.join(__dirname, '../../ui/dist');
if (fs.existsSync(uiDistPath)) {
  app.use(express.static(uiDistPath));
  
  // 所有非API路由都返回UI的index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(uiDistPath, 'index.html'));
    }
  });
}

// 启动服务器
const server = app.listen(serverConfig.port, serverConfig.host, () => {
  const dataPath = getDataPath();
  console.log('');
  console.log('='.repeat(50));
  console.log('ChatArchiver 服务器已启动');
  console.log('='.repeat(50));
  console.log(`访问地址: http://${serverConfig.host}:${serverConfig.port}`);
  console.log(`数据目录: ${dataPath}`);
  console.log(`日志文件: ${path.join(__dirname, '../../logs/server.log')}`);
  console.log('='.repeat(50));
  console.log('');
});

// 优雅关闭
function gracefulShutdown(signal: string) {
  console.log('');
  console.log(`收到 ${signal} 信号，正在关闭服务器...`);
  
  server.close(() => {
    console.log('HTTP服务器已关闭');
    closeDb();
    console.log('数据库连接已关闭');
    console.log('服务器已完全停止');
    process.exit(0);
  });
  
  // 如果5秒内没有关闭，强制退出
  setTimeout(() => {
    console.log('强制退出...');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
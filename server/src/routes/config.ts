import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { reloadConfig, getConfigPath } from '../config';

const router = Router();

// 默认配置
const defaultConfig = {
  server: {
    port: 3000,
    host: 'localhost'
  },
  data: {
    path: './data'
  }
};

// 初始化数据库
function initDatabase(dbPath: string): void {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      platform TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'uncategorized',
      filename TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      has_notes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
    CREATE INDEX IF NOT EXISTS idx_items_platform ON items(platform);
    CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);
  `);
  
  db.close();
}

// GET /api/config - 获取配置
router.get('/', (req: Request, res: Response) => {
  try {
    const CONFIG_PATH = getConfigPath();
    let config = defaultConfig;
    
    if (fs.existsSync(CONFIG_PATH)) {
      const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
      config = JSON.parse(configContent);
    }
    
    res.json(config);
  } catch (error) {
    console.error('Failed to read config:', error);
    res.status(500).json({ error: 'Failed to read config' });
  }
});

// PUT /api/config - 更新配置
router.put('/', (req: Request, res: Response) => {
  try {
    const CONFIG_PATH = getConfigPath();
    const { server, data } = req.body;
    
    // 读取现有配置
    let config = defaultConfig;
    if (fs.existsSync(CONFIG_PATH)) {
      const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
      config = JSON.parse(configContent);
    }
    
    // 更新配置
    if (server) {
      config.server = { ...config.server, ...server };
    }
    if (data) {
      config.data = { ...config.data, ...data };
    }
    
    // 解析数据路径
    const configDir = path.dirname(CONFIG_PATH);
    let resolvedPath = config.data.path;
    if (!path.isAbsolute(resolvedPath)) {
      resolvedPath = path.resolve(configDir, resolvedPath);
    }
    
    // 检查目录状态
    const exists = fs.existsSync(resolvedPath);
    let isEmpty = true;
    let hasDatabase = false;
    let contents: string[] = [];
    
    if (exists) {
      try {
        contents = fs.readdirSync(resolvedPath);
        isEmpty = contents.length === 0;
        hasDatabase = contents.includes('meta.db');
      } catch (e) {
        // 读取失败
      }
    }
    
    // 写入配置文件
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    
    // 重新加载配置（清除缓存）
    reloadConfig();
    
    // 输出配置更新日志
    console.log('');
    console.log('[配置更新]');
    console.log(`  服务器地址: ${config.server.host}:${config.server.port}`);
    console.log(`  数据目录: ${resolvedPath}`);
    console.log(`  目录状态: ${exists ? '已存在' : '不存在'}`);
    
    // 如果目录不存在或是空目录，创建数据库结构
    if (!exists || isEmpty) {
      // 创建目录
      if (!exists) {
        fs.mkdirSync(resolvedPath, { recursive: true });
      }
      
      // 创建vault目录结构
      const vaultPath = path.join(resolvedPath, 'vault');
      fs.mkdirSync(vaultPath, { recursive: true });
      
      const categories = ['work', 'study', 'personal', 'uncategorized'];
      for (const category of categories) {
        const categoryPath = path.join(vaultPath, category);
        if (!fs.existsSync(categoryPath)) {
          fs.mkdirSync(categoryPath, { recursive: true });
        }
      }
      
      // 创建数据库文件
      const dbPath = path.join(resolvedPath, 'meta.db');
      initDatabase(dbPath);
      
      console.log('  操作: 已创建新的数据目录和数据库');
      console.log('');
      
      res.json({ 
        success: true, 
        message: '配置已保存，已创建新的数据目录和数据库',
        config,
        created: true
      });
    } else if (!hasDatabase) {
      // 目录存在且非空，但没有数据库文件，创建数据库
      const dbPath = path.join(resolvedPath, 'meta.db');
      initDatabase(dbPath);
      
      console.log('  操作: 目录已存在，已创建数据库');
      console.log('');
      
      res.json({ 
        success: true, 
        message: '配置已保存，目录已存在，已创建数据库',
        config,
        created: true,
        contents
      });
    } else {
      // 目录存在且有数据库文件
      console.log('  操作: 将使用现有数据目录');
      console.log('');
      
      res.json({ 
        success: true, 
        message: '配置已保存，将使用现有数据目录',
        config,
        created: false,
        contents
      });
    }
  } catch (error) {
    console.error('Failed to update config:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// POST /api/config/validate-path - 验证路径并返回目录内容
router.post('/validate-path', (req: Request, res: Response) => {
  try {
    const { path: dirPath } = req.body;
    
    if (!dirPath) {
      return res.status(400).json({ error: '路径不能为空' });
    }
    
    // 解析路径（处理相对路径）
    const CONFIG_PATH = getConfigPath();
    const configDir = path.dirname(CONFIG_PATH);
    let resolvedPath = dirPath;
    
    if (!path.isAbsolute(dirPath)) {
      resolvedPath = path.resolve(configDir, dirPath);
    }
    
    // 检查路径是否存在
    const exists = fs.existsSync(resolvedPath);
    
    // 如果路径存在，检查是否是目录并获取内容
    let isDirectory = false;
    let isEmpty = true;
    let hasDatabase = false;
    let contents: string[] = [];
    
    if (exists) {
      const stat = fs.statSync(resolvedPath);
      isDirectory = stat.isDirectory();
      
      if (isDirectory) {
        try {
          contents = fs.readdirSync(resolvedPath);
          isEmpty = contents.length === 0;
          hasDatabase = contents.includes('meta.db');
        } catch (e) {
          // 读取失败
        }
      }
    }
    
    res.json({
      path: resolvedPath,
      exists,
      isDirectory,
      isEmpty,
      hasDatabase,
      contents,
      canUse: exists ? isDirectory : true
    });
  } catch (error) {
    console.error('Failed to validate path:', error);
    res.status(500).json({ error: 'Failed to validate path' });
  }
});

// GET /api/config/browse - 浏览目录
router.get('/browse', (req: Request, res: Response) => {
  try {
    const dirPath = (req.query.path as string) || '/';
    
    // 读取目录内容
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    // 过滤并排序
    const items = entries
      .filter(entry => !entry.name.startsWith('.')) // 隐藏隐藏文件
      .map(entry => ({
        name: entry.name,
        path: path.join(dirPath, entry.name),
        isDirectory: entry.isDirectory()
      }))
      .sort((a, b) => {
        // 目录优先
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    
    res.json({
      currentPath: dirPath,
      parentPath: path.dirname(dirPath),
      items
    });
  } catch (error: any) {
    console.error('Failed to browse directory:', error);
    res.status(500).json({ error: error.message || 'Failed to browse directory' });
  }
});

export default router;
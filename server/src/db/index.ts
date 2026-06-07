import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { getDataPath } from '../config';

let db: Database.Database | null = null;
let currentDbPath: string | null = null;

export function getDb(): Database.Database {
  const dataPath = getDataPath();
  const dbPath = path.join(dataPath, 'meta.db');
  
  // 如果数据路径改变了，关闭旧连接
  if (db && currentDbPath !== dbPath) {
    console.log('Data path changed, closing old connection');
    db.close();
    db = null;
  }
  
  if (!db) {
    // 确保目录存在
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    console.log('Opening database:', dbPath);
    db = new Database(dbPath);
    currentDbPath = dbPath;
    initDb(db);
  }
  return db;
}

function initDb(db: Database.Database): void {
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
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
    currentDbPath = null;
  }
}

export function getVaultPath(): string {
  return path.join(getDataPath(), 'vault');
}

export function getCategoryPath(category: string): string {
  const validCategories = ['work', 'study', 'personal', 'uncategorized'];
  const cat = validCategories.includes(category) ? category : 'uncategorized';
  return path.join(getVaultPath(), cat);
}
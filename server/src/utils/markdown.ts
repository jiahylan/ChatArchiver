import fs from 'fs';
import path from 'path';
import { getDb, getCategoryPath } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface ItemMeta {
  id: string;
  url: string;
  title: string;
  platform: string;
  category: string;
  filename: string;
  tags: string[];
  has_notes: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItemContent {
  conversation: string;
  notes: string;
}

// 生成安全的文件名
function sanitizeFilename(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

// 解析Markdown文件内容
function parseMarkdownFile(content: string): ItemContent {
  const parts = content.split('---\n\n## 备注\n\n');
  
  if (parts.length === 2) {
    return {
      conversation: parts[0].replace(/^---\n[\s\S]*?---\n\n/, '').trim(),
      notes: parts[1].trim()
    };
  }
  
  return {
    conversation: content.replace(/^---\n[\s\S]*?---\n\n/, '').trim(),
    notes: ''
  };
}

// 生成Markdown文件内容
function generateMarkdownContent(meta: ItemMeta, content: ItemContent): string {
  const frontmatter = `---
id: ${meta.id}
url: ${meta.url}
platform: ${meta.platform}
tags: [${meta.tags.join(', ')}]
created: ${meta.created_at}
updated: ${meta.updated_at}
---`;

  let md = `${frontmatter}\n\n# ${meta.title}\n\n## 对话内容\n\n${content.conversation}`;
  
  if (content.notes) {
    md += `\n\n---\n\n## 备注\n\n${content.notes}`;
  }
  
  return md;
}

// 创建新条目
export function createItem(data: {
  url: string;
  title: string;
  platform: string;
  category?: string;
  tags?: string[];
  conversation: string;
  notes?: string;
}): ItemMeta {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  const category = data.category || 'uncategorized';
  const tags = data.tags || [];
  const filename = `${sanitizeFilename(data.title || 'untitled')}_${id.substring(0, 8)}.md`;
  
  const meta: ItemMeta = {
    id,
    url: data.url,
    title: data.title || 'Untitled',
    platform: data.platform,
    category,
    filename,
    tags,
    has_notes: !!data.notes,
    created_at: now,
    updated_at: now
  };
  
  const content: ItemContent = {
    conversation: data.conversation,
    notes: data.notes || ''
  };
  
  // 保存到数据库
  db.prepare(`
    INSERT INTO items (id, url, title, platform, category, filename, tags, has_notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, meta.url, meta.title, meta.platform, meta.category, meta.filename, JSON.stringify(tags), meta.has_notes ? 1 : 0, now, now);
  
  // 保存Markdown文件
  const categoryPath = getCategoryPath(category);
  if (!fs.existsSync(categoryPath)) {
    fs.mkdirSync(categoryPath, { recursive: true });
  }
  
  const filePath = path.join(categoryPath, filename);
  const mdContent = generateMarkdownContent(meta, content);
  fs.writeFileSync(filePath, mdContent, 'utf-8');
  
  return meta;
}

// 获取所有条目
export function getItems(filters?: {
  category?: string;
  platform?: string;
  tag?: string;
}): ItemMeta[] {
  const db = getDb();
  
  let query = 'SELECT * FROM items WHERE 1=1';
  const params: any[] = [];
  
  if (filters?.category) {
    query += ' AND category = ?';
    params.push(filters.category);
  }
  if (filters?.platform) {
    query += ' AND platform = ?';
    params.push(filters.platform);
  }
  if (filters?.tag) {
    query += ' AND tags LIKE ?';
    params.push(`%${filters.tag}%`);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const items = db.prepare(query).all(...params) as any[];
  
  return items.map(item => ({
    ...item,
    tags: JSON.parse(item.tags || '[]'),
    has_notes: !!item.has_notes
  }));
}

// 获取单个条目
export function getItem(id: string): { meta: ItemMeta; content: ItemContent } | null {
  const db = getDb();
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as any;
  
  if (!item) return null;
  
  const meta: ItemMeta = {
    ...item,
    tags: JSON.parse(item.tags || '[]'),
    has_notes: !!item.has_notes
  };
  
  const filePath = path.join(getCategoryPath(meta.category), meta.filename);
  
  if (!fs.existsSync(filePath)) return null;
  
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const content = parseMarkdownFile(fileContent);
  
  return { meta, content };
}

// 更新条目内容
export function updateItemContent(id: string, content: Partial<ItemContent>): boolean {
  const existing = getItem(id);
  if (!existing) return false;
  
  const updatedContent: ItemContent = {
    conversation: content.conversation ?? existing.content.conversation,
    notes: content.notes ?? existing.content.notes
  };
  
  const now = new Date().toISOString();
  const db = getDb();
  
  // 更新数据库
  db.prepare(`
    UPDATE items 
    SET has_notes = ?, updated_at = ?
    WHERE id = ?
  `).run(updatedContent.notes ? 1 : 0, now, id);
  
  // 更新文件
  const meta = { ...existing.meta, updated_at: now, has_notes: !!updatedContent.notes };
  const filePath = path.join(getCategoryPath(meta.category), meta.filename);
  const mdContent = generateMarkdownContent(meta, updatedContent);
  fs.writeFileSync(filePath, mdContent, 'utf-8');
  
  return true;
}

// 更新条目元数据
export function updateItemMeta(id: string, meta: Partial<ItemMeta>): boolean {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as any;
  
  if (!existing) return false;
  
  const now = new Date().toISOString();
  
  // 如果分类改变，需要移动文件
  if (meta.category && meta.category !== existing.category) {
    const oldPath = path.join(getCategoryPath(existing.category), existing.filename);
    const newPath = path.join(getCategoryPath(meta.category), existing.filename);
    
    if (fs.existsSync(oldPath)) {
      const newDir = path.dirname(newPath);
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
      }
      fs.renameSync(oldPath, newPath);
    }
  }
  
  db.prepare(`
    UPDATE items 
    SET title = COALESCE(?, title),
        category = COALESCE(?, category),
        tags = COALESCE(?, tags),
        updated_at = ?
    WHERE id = ?
  `).run(
    meta.title ?? null,
    meta.category ?? null,
    meta.tags ? JSON.stringify(meta.tags) : null,
    now,
    id
  );
  
  return true;
}

// 删除条目
export function deleteItem(id: string): boolean {
  const db = getDb();
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as any;
  
  if (!item) return false;
  
  // 删除文件
  const filePath = path.join(getCategoryPath(item.category), item.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
  // 删除数据库记录
  db.prepare('DELETE FROM items WHERE id = ?').run(id);
  
  return true;
}
const API_BASE = '/api';

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

export interface Item extends ItemMeta {
  content?: ItemContent;
}

export interface ServerConfig {
  port: number;
  host: string;
}

export interface DataConfig {
  path: string;
}

export interface AppConfig {
  server: ServerConfig;
  data: DataConfig;
}

export interface PathValidation {
  path: string;
  exists: boolean;
  isDirectory: boolean;
  isEmpty: boolean;
  hasDatabase: boolean;
  contents: string[];
  canUse: boolean;
}

// 获取所有条目
export async function fetchItems(params?: {
  category?: string;
  platform?: string;
  tag?: string;
}): Promise<ItemMeta[]> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set('category', params.category);
  if (params?.platform) searchParams.set('platform', params.platform);
  if (params?.tag) searchParams.set('tag', params.tag);
  
  const query = searchParams.toString();
  const url = `${API_BASE}/items${query ? `?${query}` : ''}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch items');
  return response.json();
}

// 获取单个条目（包含内容）
export async function fetchItem(id: string): Promise<{ meta: ItemMeta; content: ItemContent }> {
  const response = await fetch(`${API_BASE}/items/${id}`);
  if (!response.ok) throw new Error('Failed to fetch item');
  return response.json();
}

// 创建条目
export async function createItem(data: {
  url: string;
  title: string;
  platform: string;
  category?: string;
  tags?: string[];
  conversation: string;
  notes?: string;
}): Promise<ItemMeta> {
  const response = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create item');
  return response.json();
}

// 更新内容（对话和备注）
export async function updateItemContent(id: string, data: {
  conversation?: string;
  notes?: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE}/items/${id}/content`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update content');
}

// 更新元数据
export async function updateItemMeta(id: string, data: {
  title?: string;
  category?: string;
  tags?: string[];
}): Promise<void> {
  const response = await fetch(`${API_BASE}/items/${id}/meta`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update meta');
}

// 删除条目
export async function deleteItem(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete item');
}

// 获取配置
export async function fetchConfig(): Promise<AppConfig> {
  const response = await fetch(`${API_BASE}/config`);
  if (!response.ok) throw new Error('Failed to fetch config');
  return response.json();
}

// 更新配置
export async function updateConfig(config: Partial<AppConfig>): Promise<{ 
  success: boolean; 
  message: string; 
  config: AppConfig;
  created?: boolean;
  contents?: string[];
}> {
  const response = await fetch(`${API_BASE}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!response.ok) throw new Error('Failed to update config');
  return response.json();
}

// 验证路径
export async function validatePath(path: string): Promise<PathValidation> {
  const response = await fetch(`${API_BASE}/config/validate-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  });
  if (!response.ok) throw new Error('Failed to validate path');
  return response.json();
}

// 浏览目录
export async function browseDirectory(path: string): Promise<{
  currentPath: string;
  parentPath: string;
  items: Array<{ name: string; path: string; isDirectory: boolean }>;
}> {
  const response = await fetch(`${API_BASE}/config/browse?path=${encodeURIComponent(path)}`);
  if (!response.ok) throw new Error('Failed to browse directory');
  return response.json();
}
import { Router, Request, Response } from 'express';
import { 
  createItem, 
  getItems, 
  getItem, 
  updateItemContent, 
  updateItemMeta, 
  deleteItem 
} from '../utils/markdown';

const router = Router();

// GET /api/items - 获取所有条目
router.get('/', (req: Request, res: Response) => {
  try {
    const { category, platform, tag } = req.query;
    const items = getItems({
      category: category as string,
      platform: platform as string,
      tag: tag as string
    });
    res.json(items);
  } catch (error) {
    console.error('Failed to get items:', error);
    res.status(500).json({ error: 'Failed to get items' });
  }
});

// GET /api/items/:id - 获取单个条目（包含内容）
router.get('/:id', (req: Request, res: Response) => {
  try {
    const item = getItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Failed to get item:', error);
    res.status(500).json({ error: 'Failed to get item' });
  }
});

// POST /api/items - 创建新条目
router.post('/', (req: Request, res: Response) => {
  try {
    const { url, title, platform, category, tags, conversation, notes } = req.body;
    
    if (!url || !platform || !conversation) {
      return res.status(400).json({ error: 'url, platform, and conversation are required' });
    }
    
    const item = createItem({
      url,
      title: title || 'Untitled',
      platform,
      category,
      tags,
      conversation,
      notes
    });
    
    console.log(`[新对话] ${item.title} (${item.platform})`);
    
    res.status(201).json(item);
  } catch (error) {
    console.error('Failed to create item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT /api/items/:id/content - 更新内容（对话和备注）
router.put('/:id/content', (req: Request, res: Response) => {
  try {
    const { conversation, notes } = req.body;
    const success = updateItemContent(req.params.id, { conversation, notes });
    
    if (!success) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    console.log(`[更新内容] ID: ${req.params.id}`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update content:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// PUT /api/items/:id/meta - 更新元数据
router.put('/:id/meta', (req: Request, res: Response) => {
  try {
    const { title, category, tags } = req.body;
    const success = updateItemMeta(req.params.id, { title, category, tags });
    
    if (!success) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    console.log(`[更新元数据] ID: ${req.params.id}`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update meta:', error);
    res.status(500).json({ error: 'Failed to update meta' });
  }
});

// DELETE /api/items/:id - 删除条目
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const success = deleteItem(req.params.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    console.log(`[删除对话] ID: ${req.params.id}`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
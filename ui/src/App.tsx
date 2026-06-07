import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchItems, fetchItem, updateItemContent, deleteItem, type ItemMeta, type ItemContent } from './api/client';
import Settings from './Settings';

// 右键菜单组件
function ContextMenu({ 
  x, 
  y, 
  items, 
  onClose 
}: { 
  x: number; 
  y: number; 
  items: { label: string; action: () => void; danger?: boolean; icon?: string }[]; 
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 context-menu min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
            item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
          }`}
          onClick={() => {
            item.action();
            onClose();
          }}
        >
          {item.icon && <span className="text-xs">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// 标签页组件
function Tab({ 
  item, 
  onClose, 
  onContextMenu 
}: { 
  item: ItemMeta; 
  onClose: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  // 获取平台颜色
  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      kimi: 'bg-blue-500',
      doubao: 'bg-green-500',
      chatgpt: 'bg-purple-500',
      claude: 'bg-orange-500',
      gemini: 'bg-red-500'
    };
    return colors[platform] || 'bg-gray-500';
  };

  return (
    <div 
      className="group flex items-center gap-2 px-3 py-2 cursor-pointer border-r border-gray-200 min-w-[120px] max-w-[200px] bg-white hover:bg-gray-50"
      onContextMenu={onContextMenu}
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getPlatformColor(item.platform)}`} />
      <span className="flex-1 truncate text-sm">{item.title}</span>
      <button
        className="flex-shrink-0 p-0.5 rounded hover:bg-gray-200 opacity-60 hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="关闭"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// 对话内容面板组件
function ChatPanel({ 
  item,
  width
}: { 
  item: ItemMeta;
  width: string;
}) {
  const [content, setContent] = useState<ItemContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [editMode, setEditMode] = useState<'conversation' | 'notes' | null>(null);
  const [editValue, setEditValue] = useState('');

  // 加载内容
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const data = await fetchItem(item.id);
        setContent(data.content);
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, [item.id]);

  // 保存内容
  const handleSave = async (field: 'conversation' | 'notes') => {
    if (!content) return;
    try {
      await updateItemContent(item.id, { [field]: editValue });
      setContent({ ...content, [field]: editValue });
      setEditMode(null);
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  // 获取平台颜色
  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      kimi: 'bg-blue-100 text-blue-800',
      doubao: 'bg-green-100 text-green-800',
      chatgpt: 'bg-purple-100 text-purple-800',
      claude: 'bg-orange-100 text-orange-800',
      gemini: 'bg-red-100 text-red-800'
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex flex-col border-r border-gray-200 last:border-r-0" style={{ width }}>
      {/* 头部信息 */}
      <div className="p-2 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-medium text-gray-900 truncate text-sm">{item.title}</h3>
            <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${getPlatformColor(item.platform)}`}>
              {item.platform}
            </span>
          </div>
          <button
            className={`flex-shrink-0 px-2 py-1 text-xs rounded ${
              showNotes ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setShowNotes(!showNotes)}
          >
            📝
          </button>
        </div>
        {item.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {item.tags.map(tag => (
              <span key={tag} className="text-xs px-1 py-0.5 rounded bg-gray-100 text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 内容区域 - 横向分栏 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：对话内容 */}
        <div className={`flex-1 overflow-auto p-3 ${showNotes ? 'border-r border-gray-200' : ''}`}>
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              加载中...
            </div>
          ) : editMode === 'conversation' ? (
            <div className="h-full flex flex-col">
              <textarea
                className="flex-1 w-full p-2 border rounded resize-none font-mono text-sm"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <button
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                  onClick={() => handleSave('conversation')}
                >
                  保存
                </button>
                <button
                  className="px-3 py-1 bg-gray-200 rounded text-sm"
                  onClick={() => setEditMode(null)}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="prose prose-sm max-w-none cursor-pointer h-full overflow-auto"
              onDoubleClick={() => {
                setEditMode('conversation');
                setEditValue(content?.conversation || '');
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content?.conversation || '无内容'}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* 右侧：备注区域 */}
        {showNotes && (
          <div className="w-1/2 overflow-auto p-3 bg-gray-50">
            {editMode === 'notes' ? (
              <div className="h-full flex flex-col">
                <textarea
                  className="flex-1 w-full p-2 border rounded resize-none font-mono text-sm"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="添加备注..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                    onClick={() => handleSave('notes')}
                  >
                    保存
                  </button>
                  <button
                    className="px-3 py-1 bg-gray-200 rounded text-sm"
                    onClick={() => setEditMode(null)}
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="prose prose-sm max-w-none cursor-pointer h-full overflow-auto"
                onDoubleClick={() => {
                  setEditMode('notes');
                  setEditValue(content?.notes || '');
                }}
              >
                {content?.notes ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content.notes}
                  </ReactMarkdown>
                ) : (
                  <p className="text-gray-400 italic text-sm">双击添加备注...</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部链接 */}
      <div className="p-1.5 bg-gray-50 border-t text-xs text-gray-500">
        <a 
          href={item.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-blue-500 truncate block"
        >
          {item.url}
        </a>
      </div>
    </div>
  );
}

// 主应用组件
function App() {
  const [items, setItems] = useState<ItemMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTabs, setOpenTabs] = useState<ItemMeta[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState({ category: '', platform: '' });
  const [showSettings, setShowSettings] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: { label: string; action: () => void; danger?: boolean; icon?: string }[];
  } | null>(null);

  // 加载列表
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchItems(filter);
      setItems(data);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // 打开标签页
  const openTab = (item: ItemMeta, ctrlKey: boolean = false) => {
    if (openTabs.find(t => t.id === item.id)) {
      return;
    }
    
    if (ctrlKey) {
      // Ctrl+点击：并行展示（追加）
      setOpenTabs(prev => [...prev, item]);
    } else {
      // 普通点击：替换为当前条目
      setOpenTabs([item]);
    }
  };

  // 关闭标签页
  const closeTab = (id: string) => {
    setOpenTabs(prev => prev.filter(t => t.id !== id));
  };

  // 关闭其他标签页
  const closeOtherTabs = (id: string) => {
    setOpenTabs(prev => prev.filter(t => t.id === id));
  };

  // 关闭所有标签页
  const closeAllTabs = () => {
    setOpenTabs([]);
  };

  // 删除条目
  const handleDelete = async (id: string) => {
    if (confirm('确定要删除吗？')) {
      try {
        await deleteItem(id);
        closeTab(id);
        loadItems();
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedItems.size === 0) return;
    if (confirm(`确定要删除 ${selectedItems.size} 个条目吗？`)) {
      try {
        await Promise.all(Array.from(selectedItems).map(id => deleteItem(id)));
        setSelectedItems(new Set());
        setSelectMode(false);
        loadItems();
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  // 切换选择
  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  // 进入多选模式
  const enterSelectMode = () => {
    setSelectMode(true);
    setSelectedItems(new Set());
  };

  // 退出多选模式
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedItems(new Set());
  };

  // 显示右键菜单（标签页）
  const showTabContextMenu = (e: React.MouseEvent, item: ItemMeta) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: '关闭', action: () => closeTab(item.id), icon: '✕' },
        { label: '关闭其他', action: () => closeOtherTabs(item.id), icon: '⊘' },
        { label: '关闭所有', action: closeAllTabs, icon: '⊗' },
        { label: '删除', action: () => handleDelete(item.id), danger: true, icon: '🗑' }
      ]
    });
  };

  // 显示右键菜单（列表项）
  const showListItemContextMenu = (e: React.MouseEvent, item: ItemMeta) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: '打开', action: () => openTab(item), icon: '📂' },
        { label: '多选', action: enterSelectMode, icon: '☑' },
        { label: '删除', action: () => handleDelete(item.id), danger: true, icon: '🗑' }
      ]
    });
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: 退出多选模式
      if (e.key === 'Escape' && selectMode) {
        exitSelectMode();
      }
      // Delete: 删除选中的条目
      if (e.key === 'Delete' && selectedItems.size > 0) {
        e.preventDefault();
        handleBatchDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectMode, selectedItems]);

  // 获取平台颜色
  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      kimi: 'bg-blue-100 text-blue-800',
      doubao: 'bg-green-100 text-green-800',
      chatgpt: 'bg-purple-100 text-purple-800',
      claude: 'bg-orange-100 text-orange-800',
      gemini: 'bg-red-100 text-red-800'
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  // 计算每个面板的宽度
  const getPanelWidth = () => {
    const count = openTabs.length;
    if (count === 0) return '100%';
    return `${100 / count}%`;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 头部 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-full px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-blue-600">ChatArchiver</h1>
            <div className="flex gap-2">
              <select 
                className="px-2 py-1 border rounded text-sm"
                value={filter.category}
                onChange={e => setFilter({ ...filter, category: e.target.value })}
              >
                <option value="">所有分类</option>
                <option value="work">工作</option>
                <option value="study">学习</option>
                <option value="personal">个人</option>
                <option value="uncategorized">未分类</option>
              </select>
              <select 
                className="px-2 py-1 border rounded text-sm"
                value={filter.platform}
                onChange={e => setFilter({ ...filter, platform: e.target.value })}
              >
                <option value="">所有平台</option>
                <option value="kimi">Kimi</option>
                <option value="doubao">豆包</option>
                <option value="chatgpt">ChatGPT</option>
                <option value="claude">Claude</option>
                <option value="gemini">Gemini</option>
              </select>
              <button 
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                onClick={loadItems}
              >
                刷新
              </button>
              <button 
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                onClick={() => setShowSettings(true)}
                title="设置"
              >
                ⚙️
              </button>
              {selectMode && (
                <>
                  <button 
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    onClick={handleBatchDelete}
                    disabled={selectedItems.size === 0}
                  >
                    删除 ({selectedItems.size})
                  </button>
                  <button 
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    onClick={exitSelectMode}
                  >
                    取消
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧列表 */}
        <div className="w-64 bg-white border-r overflow-auto flex-shrink-0">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-gray-700">对话列表</h2>
              {selectMode && (
                <label className="flex items-center gap-1 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === items.length && items.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                  全选
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              共 {items.length} 个对话
              {selectMode && ` · 已选 ${selectedItems.size}`}
            </p>
          </div>
          {loading ? (
            <div className="p-4 text-center text-gray-500">加载中...</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-center text-gray-500">暂无内容</div>
          ) : (
            <div className="divide-y">
              {items.map(item => (
                <div 
                  key={item.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 ${
                    openTabs.find(t => t.id === item.id) ? 'bg-blue-50' : ''
                  } ${selectedItems.has(item.id) ? 'bg-blue-50' : ''}`}
                  onClick={(e) => selectMode ? toggleSelect(item.id) : openTab(item, e.ctrlKey)}
                  onContextMenu={(e) => showListItemContextMenu(e, item)}
                >
                  <div className="flex items-start gap-2">
                    {selectMode && (
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(item.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate text-sm">
                        {item.title}
                      </h4>
                      <div className="flex gap-1 mt-1">
                        <span className={`text-xs px-1 py-0.5 rounded ${getPlatformColor(item.platform)}`}>
                          {item.platform}
                        </span>
                        {item.has_notes && (
                          <span className="text-xs px-1 py-0.5 rounded bg-yellow-100 text-yellow-800">
                            备注
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 truncate">
                        {item.tags.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 标签页栏 */}
          {openTabs.length > 0 && (
            <div className="flex bg-gray-100 border-b overflow-x-auto">
              {openTabs.map(tab => (
                <Tab
                  key={tab.id}
                  item={tab}
                  onClose={() => closeTab(tab.id)}
                  onContextMenu={(e) => showTabContextMenu(e, tab)}
                />
              ))}
            </div>
          )}

          {/* 内容区域 - 等分展示 */}
          <div className="flex-1 flex overflow-hidden">
            {openTabs.length === 0 ? (
              <div className="flex items-center justify-center w-full text-gray-400">
                <div className="text-center">
                  <p className="text-lg mb-2">从左侧选择一个对话开始查看</p>
                  <p className="text-sm">右键点击条目可查看更多选项</p>
                  <p className="text-sm mt-1">支持多选和批量删除</p>
                </div>
              </div>
            ) : (
              openTabs.map(tab => (
                <ChatPanel
                  key={tab.id}
                  item={tab}
                  width={getPanelWidth()}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* 设置页面 */}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;
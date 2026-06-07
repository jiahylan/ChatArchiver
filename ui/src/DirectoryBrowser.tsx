import { useState, useEffect } from 'react';

interface DirectoryBrowserProps {
  onSelect: (path: string) => void;
  onClose: () => void;
  initialPath?: string;
}

interface DirectoryItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

export default function DirectoryBrowser({ onSelect, onClose, initialPath = '/' }: DirectoryBrowserProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [parentPath, setParentPath] = useState('');
  const [items, setItems] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputPath, setInputPath] = useState(initialPath);

  // 加载目录内容
  const loadDirectory = async (dirPath: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/config/browse?path=${encodeURIComponent(dirPath)}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to browse directory');
      }
      
      const data = await response.json();
      setCurrentPath(data.currentPath);
      setParentPath(data.parentPath);
      setItems(data.items);
      setInputPath(data.currentPath);
    } catch (error: any) {
      console.error('Failed to load directory:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadDirectory(initialPath);
  }, [initialPath]);

  // 点击目录
  const handleItemClick = (item: DirectoryItem) => {
    if (item.isDirectory) {
      loadDirectory(item.path);
    }
  };

  // 返回上级目录
  const handleGoUp = () => {
    if (parentPath && parentPath !== currentPath) {
      loadDirectory(parentPath);
    }
  };

  // 输入路径跳转
  const handleGoToPath = () => {
    if (inputPath) {
      loadDirectory(inputPath);
    }
  };

  // 选择当前目录
  const handleSelectCurrent = () => {
    onSelect(currentPath);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">选择目录</h2>
          <button
            className="p-1 rounded hover:bg-gray-100"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 路径输入 */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={inputPath}
            onChange={(e) => setInputPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGoToPath()}
            placeholder="输入路径..."
          />
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={handleGoToPath}
          >
            跳转
          </button>
        </div>

        {/* 当前路径和返回按钮 */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <button
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            onClick={handleGoUp}
            disabled={!parentPath || parentPath === currentPath}
          >
            ↑ 上级
          </button>
          <span className="text-gray-600 truncate flex-1">
            {currentPath}
          </span>
        </div>

        {/* 目录网格 */}
        <div className="flex-1 overflow-y-auto border rounded-lg mb-4 p-3">
          {loading ? (
            <div className="p-4 text-center text-gray-500">加载中...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-center text-gray-500">此目录为空</div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {/* 返回上级目录 */}
              {parentPath && parentPath !== currentPath && (
                <div
                  className="flex flex-col items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={handleGoUp}
                >
                  <span className="text-3xl">📁</span>
                  <span className="text-xs text-center text-gray-600 truncate w-full">
                    ..
                  </span>
                </div>
              )}
              
              {/* 目录和文件 */}
              {items.map((item) => (
                <div
                  key={item.path}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                    item.isDirectory 
                      ? 'hover:bg-blue-50' 
                      : 'hover:bg-gray-100 opacity-60'
                  }`}
                  onClick={() => handleItemClick(item)}
                >
                  <span className="text-3xl">
                    {item.isDirectory ? '📁' : '📄'}
                  </span>
                  <span className="text-xs text-center text-gray-700 truncate w-full" title={item.name}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={handleSelectCurrent}
          >
            选择此目录
          </button>
        </div>
      </div>
    </div>
  );
}
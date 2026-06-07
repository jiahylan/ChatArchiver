import { useState, useEffect } from 'react';
import { fetchConfig, updateConfig, validatePath, type AppConfig, type PathValidation } from './api/client';
import DirectoryBrowser from './DirectoryBrowser';

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [pathStatus, setPathStatus] = useState<PathValidation | null>(null);
  const [showDirectoryBrowser, setShowDirectoryBrowser] = useState(false);

  // 加载配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await fetchConfig();
        setConfig(data);
        // 验证当前路径
        checkPath(data.data.path);
      } catch (error) {
        console.error('Failed to load config:', error);
        setMessage({ type: 'error', text: '加载配置失败' });
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  // 验证路径
  const checkPath = async (path: string) => {
    try {
      const result = await validatePath(path);
      setPathStatus(result);
    } catch (error) {
      console.error('Failed to validate path:', error);
      setPathStatus(null);
    }
  };

  // 路径变化时验证
  const handlePathChange = (path: string) => {
    if (config) {
      setConfig({ ...config, data: { ...config.data, path } });
      // 延迟验证，避免频繁请求
      setTimeout(() => checkPath(path), 500);
    }
  };

  // 选择目录
  const handleSelectDirectory = (path: string) => {
    handlePathChange(path);
    setShowDirectoryBrowser(false);
  };

  // 保存配置
  const handleSave = async () => {
    if (!config) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const result = await updateConfig(config);
      if (result.success) {
        // 延迟关闭，让用户看到成功消息
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      setMessage({ type: 'error', text: '保存配置失败' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="text-center">加载中...</div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="text-center text-red-500">加载配置失败</div>
          <button
            className="mt-4 w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">设置</h2>
          <button
            className="p-1 rounded hover:bg-gray-100"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 
            message.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* 服务器设置 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">服务器设置</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                主机地址
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.server.host}
                onChange={(e) => setConfig({
                  ...config,
                  server: { ...config.server, host: e.target.value }
                })}
                placeholder="localhost"
              />
              <p className="mt-1 text-xs text-gray-500">
                使用 0.0.0.0 可以允许外部访问
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                端口
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.server.port}
                onChange={(e) => setConfig({
                  ...config,
                  server: { ...config.server, port: parseInt(e.target.value) || 3000 }
                })}
                min="1"
                max="65535"
              />
            </div>
          </div>
        </div>

        {/* 数据存储设置 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">数据存储</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              数据目录路径
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.data.path}
                onChange={(e) => handlePathChange(e.target.value)}
                placeholder="./data"
              />
              <button
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1"
                onClick={() => setShowDirectoryBrowser(true)}
                title="浏览服务器目录"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                浏览
              </button>
            </div>
            
            {/* 路径状态 */}
            {pathStatus && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${pathStatus.exists ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm text-gray-600">
                    {pathStatus.exists ? '目录存在' : '目录不存在（保存时将自动创建）'}
                  </span>
                </div>
                
                {pathStatus.exists && pathStatus.isDirectory && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${pathStatus.isEmpty ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                    <span className="text-sm text-gray-600">
                      {pathStatus.isEmpty ? '目录为空' : `目录包含 ${pathStatus.contents.length} 个项目`}
                    </span>
                  </div>
                )}
                
                {pathStatus.exists && !pathStatus.isDirectory && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm text-red-600">路径不是目录</span>
                  </div>
                )}
                
                {/* 显示目录内容 */}
                {pathStatus.exists && pathStatus.isDirectory && pathStatus.contents.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">目录内容：</p>
                    <div className="max-h-32 overflow-y-auto">
                      {pathStatus.contents.map((item, index) => (
                        <div key={index} className="text-xs text-gray-600 py-0.5 flex items-center gap-1">
                          <span>{item.includes('.') ? '📄' : '📁'}</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-2 text-xs text-gray-500">
                  完整路径: {pathStatus.path}
                </div>
              </div>
            )}
            
            <p className="mt-2 text-xs text-gray-500">
              支持相对路径（相对于项目根目录）和绝对路径。点击"浏览"按钮可浏览服务器目录。
            </p>
          </div>
        </div>

        {/* 说明信息 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">说明</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 配置保存后需要重启服务器才能生效</li>
            <li>• 如果目录为空，系统会自动创建数据库文件</li>
            <li>• 如果目录已有内容，将使用现有数据</li>
            <li>• 建议将数据目录作为独立的git仓库管理</li>
          </ul>
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
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 目录浏览器 */}
      {showDirectoryBrowser && (
        <DirectoryBrowser
          onSelect={handleSelectDirectory}
          onClose={() => setShowDirectoryBrowser(false)}
          initialPath={pathStatus?.path || '/'}
        />
      )}
    </div>
  );
}
// 检测平台
function detectPlatform(url) {
  if (url.includes('kimi.moonshot.cn')) return 'kimi';
  if (url.includes('doubao.com')) return 'doubao';
  if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) return 'chatgpt';
  if (url.includes('claude.ai')) return 'claude';
  if (url.includes('bard.google.com') || url.includes('gemini.google.com')) return 'gemini';
  return 'unknown';
}

// 获取平台名称
function getPlatformName(platform) {
  const names = {
    kimi: 'Kimi',
    doubao: '豆包',
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    gemini: 'Gemini',
    unknown: '未知平台'
  };
  return names[platform] || platform;
}

// 显示状态消息
function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.classList.remove('hidden');
  
  setTimeout(() => {
    statusEl.classList.add('hidden');
  }, 3000);
}

// 从剪贴板读取内容
async function readFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    return text;
  } catch (error) {
    console.error('Failed to read clipboard:', error);
    throw new Error('无法读取剪贴板内容，请确保已授权剪贴板访问权限');
  }
}

// 保存到服务器
async function saveToServer(data) {
  const response = await fetch('http://localhost:3000/api/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save');
  }
  
  return response.json();
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab) {
    const url = tab.url;
    const platform = detectPlatform(url);
    
    // 显示页面信息
    document.getElementById('url').textContent = url;
    document.getElementById('platform').textContent = getPlatformName(platform);
    
    // 设置默认标题
    document.getElementById('title').value = tab.title || '';
  }
  
  // 读取剪贴板按钮
  document.getElementById('read-clipboard-btn').addEventListener('click', async () => {
    try {
      const clipboardContent = await readFromClipboard();
      document.getElementById('clipboard-preview').textContent = 
        clipboardContent.substring(0, 200) + (clipboardContent.length > 200 ? '...' : '');
      document.getElementById('preview-container').classList.remove('hidden');
      document.getElementById('save-btn').disabled = false;
      
      // 保存剪贴板内容到临时变量
      window.clipboardContent = clipboardContent;
      
      showStatus('剪贴板内容已读取', 'success');
    } catch (error) {
      showStatus(error.message, 'error');
    }
  });
  
  // 保存按钮点击事件
  document.getElementById('save-btn').addEventListener('click', async () => {
    const btn = document.getElementById('save-btn');
    btn.disabled = true;
    btn.textContent = '保存中...';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 获取表单数据
      const title = document.getElementById('title').value || tab.title;
      const tags = document.getElementById('tags').value
        .split(',')
        .map(t => t.trim())
        .filter(t => t);
      const category = document.getElementById('category').value;
      const notes = document.getElementById('notes').value;
      const platform = detectPlatform(tab.url);
      
      // 保存到服务器
      await saveToServer({
        url: tab.url,
        title,
        platform,
        category,
        tags,
        conversation: window.clipboardContent,
        notes
      });
      
      showStatus('保存成功！', 'success');
      
      // 清空表单
      document.getElementById('tags').value = '';
      document.getElementById('notes').value = '';
      document.getElementById('preview-container').classList.add('hidden');
      document.getElementById('save-btn').disabled = true;
      window.clipboardContent = null;
    } catch (error) {
      showStatus('保存失败：' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '保存对话';
    }
  });
  
  // 打开管理界面按钮
  document.getElementById('open-ui-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });
});
// 通用对话内容提取器
// 支持多个AI对话平台

// 平台配置
const PLATFORM_CONFIGS = {
  kimi: {
    hostPatterns: ['kimi.moonshot.cn'],
    messageSelector: '[class*="message"], [class*="chat-message"]',
    userMessagePattern: /user|human|question/i,
    contentSelector: '[class*="content"], [class*="text"], [class*="body"]',
    titleSelector: 'title'
  },
  doubao: {
    hostPatterns: ['www.doubao.com', 'doubao.com'],
    messageSelector: '[class*="message"], [class*="chat-item"], [class*="conversation-item"]',
    userMessagePattern: /user|human|question/i,
    contentSelector: '[class*="content"], [class*="text"], [class*="message-body"]',
    titleSelector: 'title'
  },
  chatgpt: {
    hostPatterns: ['chat.openai.com', 'chatgpt.com'],
    messageSelector: '[data-message-author-role], [class*="message"]',
    userMessagePattern: /user|human/i,
    contentSelector: '[class*="content"], [class*="text"], .markdown',
    titleSelector: 'title'
  },
  claude: {
    hostPatterns: ['claude.ai'],
    messageSelector: '[class*="message"], [class*="chat-message"]',
    userMessagePattern: /user|human/i,
    contentSelector: '[class*="content"], [class*="text"]',
    titleSelector: 'title'
  },
  gemini: {
    hostPatterns: ['gemini.google.com', 'bard.google.com'],
    messageSelector: '[class*="message"], [class*="conversation-turn"]',
    userMessagePattern: /user|human/i,
    contentSelector: '[class*="content"], [class*="text"], .markdown',
    titleSelector: 'title'
  }
};

// 检测当前平台
function detectPlatform() {
  const hostname = window.location.hostname;
  
  for (const [platform, config] of Object.entries(PLATFORM_CONFIGS)) {
    if (config.hostPatterns.some(pattern => hostname.includes(pattern))) {
      return platform;
    }
  }
  
  return 'unknown';
}

// 通用内容提取
function extractWithSelector(config) {
  const messages = [];
  const messageElements = document.querySelectorAll(config.messageSelector);
  
  messageElements.forEach(el => {
    const classStr = el.className || '';
    const isUser = config.userMessagePattern.test(classStr);
    
    const contentEl = el.querySelector(config.contentSelector);
    const content = contentEl?.textContent?.trim() || el.textContent?.trim() || '';
    
    if (content && content.length > 0) {
      messages.push({
        role: isUser ? 'user' : 'assistant',
        content: content
      });
    }
  });
  
  return messages;
}

// 尝试从页面结构推断消息角色
function inferMessageRole(el) {
  // 检查父元素或自身是否有表示用户消息的类名
  const checkElement = (elem) => {
    if (!elem) return false;
    const classStr = elem.className || '';
    return /user|human|question|me/i.test(classStr);
  };
  
  // 检查自身
  if (checkElement(el)) return 'user';
  
  // 检查父元素
  if (checkElement(el.parentElement)) return 'user';
  
  // 检查属性
  const role = el.getAttribute('data-role') || el.getAttribute('role') || '';
  if (/user|human/i.test(role)) return 'user';
  
  // 默认返回assistant
  return 'assistant';
}

// 提取页面标题作为对话标题
function extractTitle() {
  // 尝试从页面标题获取
  const title = document.title;
  
  // 清理标题（移除平台名称等）
  const cleanTitle = title
    .replace(/\s*[-|—]\s*(ChatGPT|Claude|Kimi|豆包|Gemini|Bard).*$/i, '')
    .trim();
  
  return cleanTitle || 'Untitled Conversation';
}

// 主提取函数
function extractChatContent() {
  const platform = detectPlatform();
  const config = PLATFORM_CONFIGS[platform];
  
  let messages = [];
  
  if (config) {
    messages = extractWithSelector(config);
  } else {
    // 通用提取逻辑
    messages = extractGeneric();
  }
  
  // 过滤空消息
  messages = messages.filter(m => m.content.length > 0);
  
  // 合并连续的相同角色消息
  messages = mergeConsecutiveMessages(messages);
  
  return {
    title: extractTitle(),
    messages,
    platform
  };
}

// 通用提取逻辑（当平台未明确支持时）
function extractGeneric() {
  const messages = [];
  
  // 尝试常见的消息选择器
  const selectors = [
    '[class*="message"]',
    '[class*="chat"]',
    '[class*="conversation"]',
    '[data-role]',
    'article',
    '.message',
    '.chat-message'
  ];
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      elements.forEach(el => {
        const role = inferMessageRole(el);
        const content = el.textContent?.trim() || '';
        
        if (content.length > 10) { // 过滤太短的内容
          messages.push({ role, content });
        }
      });
      
      if (messages.length > 0) break;
    }
  }
  
  return messages;
}

// 合并连续的相同角色消息
function mergeConsecutiveMessages(messages) {
  if (messages.length === 0) return [];
  
  const merged = [messages[0]];
  
  for (let i = 1; i < messages.length; i++) {
    const last = merged[merged.length - 1];
    const current = messages[i];
    
    if (last.role === current.role) {
      // 合并消息
      last.content += '\n\n' + current.content;
    } else {
      merged.push(current);
    }
  }
  
  return merged;
}

// 转换为Markdown格式
function toMarkdown(result) {
  const lines = [];
  
  // 添加标题
  lines.push(`# ${result.title}\n`);
  
  // 添加消息
  result.messages.forEach((msg, index) => {
    const roleHeader = msg.role === 'user' ? '## User' : '## Assistant';
    lines.push(roleHeader);
    lines.push('');
    lines.push(msg.content);
    
    // 添加分隔线（除了最后一条消息）
    if (index < result.messages.length - 1) {
      lines.push('\n---\n');
    }
  });
  
  return lines.join('\n');
}

// 导出（供content script使用）
if (typeof window !== 'undefined') {
  window.ChatArchiverExtractor = {
    extract: extractChatContent,
    toMarkdown,
    detectPlatform
  };
}
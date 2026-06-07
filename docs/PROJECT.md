# ChatArchiver 项目开发文档

> 本文档供 AI Agent 阅读，用于快速了解项目当前状态和开发情况。

## 项目概述

**ChatArchiver** 是一个 AI 对话归档管理器，用于保存和管理多个 AI 平台的对话内容。

**核心功能**：
- 浏览器插件一键保存对话（通过剪贴板）
- 对话内容存储为 Markdown 文件
- 分类、标签、备注管理
- 多对话分栏展示（最多3个）
- 数据目录可配置，支持自定义路径

## 技术架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  浏览器插件       │────▶│  本地服务器       │────▶│  数据存储         │
│  (Chrome/Edge/   │     │  (Express)       │     │  (SQLite + MD)   │
│   Firefox)       │     │  localhost:3000  │     │                  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │  Web UI          │
                        │  (React)         │
                        └─────────────────┘
```

## 文件结构

```
ChatArchiver/
├── config.example.json         # 配置模板
├── config.json                 # 本地配置（git忽略）
├── data/                       # 数据目录（git忽略）
│   └── vault/                  # Markdown文件
│       ├── work/
│       ├── study/
│       ├── personal/
│       └── uncategorized/
├── logs/                       # 日志目录（git忽略）
│   └── server.log
├── extension/                  # 浏览器插件
│   ├── chrome/
│   ├── edge/
│   └── firefox/
├── server/                     # 后端服务
│   └── src/
│       ├── index.ts            # 入口
│       ├── config.ts           # 配置模块
│       ├── db/index.ts         # 数据库
│       ├── routes/
│       │   ├── items.ts        # 对话API
│       │   └── config.ts       # 配置API
│       └── utils/markdown.ts   # MD工具
├── ui/                         # 前端UI
│   └── src/
│       ├── App.tsx             # 主组件
│       ├── Settings.tsx        # 设置页
│       ├── DirectoryBrowser.tsx # 目录浏览器
│       └── api/client.ts       # API客户端
├── start.sh                    # Linux启动脚本
├── start.bat                   # Windows启动脚本
└── package-extensions.sh       # 打包脚本
```

## API 接口

### 对话管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/items | 获取对话列表 |
| GET | /api/items/:id | 获取对话详情 |
| POST | /api/items | 创建对话 |
| PUT | /api/items/:id/content | 更新对话内容 |
| PUT | /api/items/:id/meta | 更新对话元数据 |
| DELETE | /api/items/:id | 删除对话 |

### 配置管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/config | 获取配置 |
| PUT | /api/config | 更新配置 |
| POST | /api/config/validate-path | 验证路径 |
| POST | /api/config/create-path | 创建目录 |
| GET | /api/config/browse | 浏览目录 |

## 数据模型

### 对话条目 (Item)

```typescript
interface ItemMeta {
  id: string;           // UUID
  url: string;          // 原始链接
  title: string;        // 标题
  platform: string;     // 平台：kimi/doubao/chatgpt/claude/gemini
  category: string;     // 分类：work/study/personal/uncategorized
  filename: string;     // Markdown文件名
  tags: string[];       // 标签数组
  has_notes: boolean;   // 是否有备注
  created_at: string;   // 创建时间
  updated_at: string;   // 更新时间
}

interface ItemContent {
  conversation: string; // 对话内容（Markdown）
  notes: string;        // 备注内容（Markdown）
}
```

### 配置 (Config)

```typescript
interface AppConfig {
  server: {
    port: number;       // 服务器端口，默认3000
    host: string;       // 主机地址，默认localhost
  };
  data: {
    path: string;       // 数据目录路径，默认./data
  };
}
```

## 浏览器插件

**工作流程**：
1. 用户在 AI 平台点击 "Copy Text"
2. 点击插件图标，点击 "读取剪贴板内容"
3. 填写标题、标签、分类
4. 点击 "保存对话"

**支持的平台**：
- kimi.moonshot.cn
- doubao.com
- chat.openai.com / chatgpt.com
- claude.ai
- gemini.google.com / bard.google.com

## 前端UI

**组件结构**：
- `App.tsx`：主组件，包含列表和分栏展示
- `Settings.tsx`：设置页面，可修改配置
- `DirectoryBrowser.tsx`：目录浏览器，用于选择数据路径

**交互特性**：
- 右键菜单：打开、多选、删除
- 标签页：关闭、关闭其他、关闭所有
- 快捷键：Delete 删除选中项
- 分栏展示：最多同时显示3个对话

## 数据存储

**Markdown 文件格式**：
```markdown
---
id: xxx
url: https://...
platform: kimi
tags: [tag1, tag2]
created: 2026-01-01T00:00:00Z
updated: 2026-01-01T00:00:00Z
---

# 对话标题

## 对话内容

## User
用户消息

---

## Assistant
AI回复

---

## 备注
用户备注内容
```

## 启动方式

**Linux/Mac**：
```bash
./start.sh
```

**Windows**：
```cmd
start.bat
```

**手动启动**：
```bash
cd server && npm install && npm run build
cd ../ui && npm install && npm run build
setsid node server/dist/index.js > logs/server.log 2>&1 &
```

**查看日志**：
```bash
# Linux/Mac
cat logs/server.log

# Windows
type logs\server.log
```

## 待办事项

- [ ] 支持更多 AI 平台
- [ ] 对话搜索功能
- [ ] 导出功能（PDF、HTML）
- [ ] 对话分享功能
- [ ] 移动端适配

## 注意事项

1. **配置文件**：`config.json` 不提交 git，每个环境独立配置
2. **数据目录**：默认在 `./data`，可通过配置修改
3. **日志目录**：在 `./logs/server.log`，方便查看和清理
4. **端口冲突**：默认使用 3000 端口，可在配置中修改
5. **浏览器兼容**：Chrome/Edge 完整支持，Firefox 需要 Developer Edition
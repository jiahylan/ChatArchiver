# ChatArchiver

**AI对话归档管理器** —— 像管理文献一样管理你的AI对话

## 项目简介

ChatArchiver 是一款专为重度AI用户设计的对话归档管理工具。当你同时使用 Kimi、豆包、ChatGPT、Claude 等多个AI平台时，是否遇到过这些痛点：

- 🔍 **对话难找**：精彩的对话淹没在历史记录中，再也找不到
- 📂 **无法分类**：工作、学习、个人的对话混在一起
- 📝 **缺少备注**：想给对话添加笔记，但平台不支持
- 🔄 **多端不同步**：在公司和家里用不同设备，对话无法共享
- 📊 **无法对比**：想同时查看多个对话，却只能来回切换

ChatArchiver 解决了这些问题：

- ✅ **一键保存**：通过浏览器插件，一键保存任意AI平台的对话
- ✅ **自由分类**：支持自定义分类和标签，像 Zotero 管理文献一样管理对话
- ✅ **Markdown存储**：对话内容保存为 Markdown 文件，可随时编辑和导出
- ✅ **备注功能**：为每个对话添加笔记，记录关键要点
- ✅ **数据目录可配置**：支持自定义数据存储路径，可放在任意位置
- ✅ **分栏展示**：支持Ctrl+点击并行展示多个对话，方便对比查看

## 技术栈

| 组件 | 技术 |
|------|------|
| 浏览器插件 | Manifest V3 (Chrome/Edge) / Manifest V2 (Firefox) |
| 后端服务 | Node.js + Express + TypeScript |
| 数据库 | SQLite (better-sqlite3) |
| 前端UI | React + Vite + Tailwind CSS |
| Markdown渲染 | react-markdown + remark-gfm |

## 项目结构

```
ChatArchiver/
├── config.example.json             # 配置文件模板
├── config.json                     # 配置文件（本地，不提交git）
│
├── data/                           # 数据目录（默认，可配置）
│   └── vault/                      # Markdown文件存储
│       ├── work/                   # 工作分类
│       ├── study/                  # 学习分类
│       ├── personal/               # 个人分类
│       └── uncategorized/          # 未分类
│
├── logs/                           # 日志目录
│   └── server.log                  # 服务器日志
│
├── extension/                      # 浏览器插件
│   ├── chrome/                     # Chrome插件 (Manifest V3)
│   ├── edge/                       # Edge插件 (Manifest V3)
│   └── firefox/                    # Firefox插件 (Manifest V2)
│
├── server/                         # 后端服务
│   ├── src/                        # TypeScript源代码
│   │   ├── index.ts                # Express服务器入口
│   │   ├── config.ts               # 配置读取模块
│   │   ├── db/                     # 数据库模块
│   │   ├── routes/                 # API路由
│   │   └── utils/                  # 工具函数
│   ├── dist/                       # 编译输出
│   └── package.json
│
├── ui/                             # 前端UI
│   ├── src/                        # React源代码
│   │   ├── App.tsx                 # 主组件
│   │   ├── Settings.tsx            # 设置页面
│   │   ├── DirectoryBrowser.tsx    # 目录浏览器
│   │   └── api/                    # API客户端
│   ├── dist/                       # 构建输出
│   └── package.json
│
├── docs/                           # 文档
│
├── start.sh                        # Linux/Mac启动脚本
├── start.bat                       # Windows启动脚本
├── package-extensions.sh           # 打包脚本
└── README.md
```

## 快速开始

### Linux/Mac

```bash
# 克隆项目
git clone https://github.com/your-username/ChatArchiver.git
cd ChatArchiver

# 一键启动
./start.sh
```

### Windows

```cmd
# 克隆项目
git clone https://github.com/your-username/ChatArchiver.git
cd ChatArchiver

# 一键启动
start.bat
```

### 访问应用

启动后访问: http://localhost:3000

### 停止服务器

按 `Ctrl+C` 停止服务器

### 查看日志

```bash
# Linux/Mac
cat logs/server.log

# Windows
type logs\server.log
```

## 配置说明

配置文件 `config.json` 位于项目根目录：

```json
{
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "data": {
    "path": "./data"
  }
}
```

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `server.port` | number | 3000 | 服务器端口 |
| `server.host` | string | "localhost" | 服务器主机地址 |
| `data.path` | string | "./data" | 数据存储路径 |

**数据路径支持：**
- 相对路径：`./data`（相对于项目根目录）
- 绝对路径：`/home/user/chatarchiver-data` 或 `D:\ChatArchiver\data`

**多端数据共享：**

将数据目录放在云盘同步文件夹或共享NAS中，即可实现多设备数据同步：

```json
{
  "data": {
    "path": "/Users/username/Dropbox/ChatArchiver/data"
  }
}
```

## 浏览器插件安装

### Chrome / Edge

1. 打开 `chrome://extensions/` 或 `edge://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `extension/chrome` 或 `extension/edge` 目录

### Firefox

1. 下载 [Firefox Developer Edition](https://www.mozilla.org/en-US/firefox/developer/)
2. 打开 `about:config`，搜索 `xpinstall.signatures.required`，设置为 `false`
3. 打开 `about:debugging#/runtime/this-firefox`
4. 点击"临时载入附加组件"，选择 `extension/firefox/manifest.json`

## 使用方法

### 保存对话

1. 在AI对话页面点击 **"Copy Text"** 或 **"复制"** 按钮
2. 点击浏览器插件图标
3. 点击 **"读取剪贴板内容"** 按钮
4. 填写标题、标签、分类
5. 点击 **"保存对话"** 按钮

### 管理对话

- **打开对话**：点击左侧列表中的条目
- **并行展示**：按住 `Ctrl` 点击多个条目
- **关闭对话**：点击标签页上的 X 按钮
- **右键菜单**：
  - 列表项右键：打开、多选、删除
  - 标签页右键：关闭、关闭其他、关闭所有、删除
- **批量操作**：右键选择"多选"后，可批量选择和删除

### 编辑内容

- **编辑对话**：双击对话内容区域
- **编辑备注**：双击备注区域
- **切换备注**：点击面板右上角的 📝 按钮

### 设置

点击头部的 ⚙️ 按钮打开设置页面，可以：
- 修改服务器主机地址和端口
- 浏览并选择数据目录路径
- 创建新的数据目录

## 支持的平台

- Kimi (kimi.moonshot.cn)
- 豆包 (doubao.com)
- ChatGPT (chatgpt.com)
- Claude (claude.ai)
- Gemini (gemini.google.com)

## 打包浏览器扩展

```bash
# 打包所有浏览器扩展
./package-extensions.sh all

# 只打包Chrome扩展
./package-extensions.sh chrome

# 只打包Edge扩展
./package-extensions.sh edge

# 只打包Firefox扩展
./package-extensions.sh firefox
```

打包后的文件位于 `build/` 目录。

## 日志说明

服务器会输出以下关键日志：

```
==================================================
ChatArchiver 服务器已启动
==================================================
访问地址: http://localhost:3000
数据目录: /home/user/ChatArchiver/data
日志文件: /home/user/ChatArchiver/logs/server.log
==================================================

[API] GET /api/health - 200 (5ms)
[新对话] 测试对话 (kimi)
[更新内容] ID: xxx
[配置更新]
  服务器地址: localhost:3000
  数据目录: /home/user/ChatArchiver/data
```

## 致谢

感谢以下工具和平台的支持：

- **小米 MiMo-V2.5-Pro**：本项目由小米 MiMo-V2.5-Pro 模型辅助开发，提供了高质量的代码生成和架构设计建议
- **[OpenCode](https://opencode.ai)**：感谢 OpenCode 提供的 AI 编程助手平台，让开发过程更加高效

## License

MIT
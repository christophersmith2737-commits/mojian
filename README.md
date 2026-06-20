# 墨笺 (MoJian) — AI 智能日记本

> 每日一页，记录时光。多人格 AI 以不同视角回复你的日记。

![license](https://img.shields.io/badge/license-MIT-green)
![react](https://img.shields.io/badge/react-19-blue)
![electron](https://img.shields.io/badge/electron-42-blue)
![capacitor](https://img.shields.io/badge/capacitor-android-blue)

## ✨ 功能

- **日记写作** — 优雅的编辑器，当天可编辑，过往只读，自动保存到本地
- **日历视图** — 按月浏览，有内容的日期标记书签，AI 回复日期高亮发光蓝点
- **多人格 AI 回复** — 自定义多种 AI 人格（温柔大小姐、傲娇贤狼、颓废贝斯手…），每种人格以不同视角和语气回复你的日记
- **隔天解锁机制** — 当天请求的 AI 回复隔天才能查看，保留期待感 ✨
- **5 个预设人格** — 开箱即用：丰川祥子、长崎素世、贤狼赫萝、广井菊里、十二劳情阵
- **公共提示词** — 全局追加到所有人格的回复指令中
- **双主题** — 浅色/深色主题一键切换
- **本地隐私** — 所有数据（日记、配置、API Key）仅保存在你的电脑本地，不上传任何服务器

## 🚀 桌面端 - 快速开始

### 方式一：直接运行（无需 Node.js）

仅需 **Python 3**：

```
双击 启动墨笺-免构建.bat
```

浏览器自动打开 `http://localhost:5174`。

### 方式二：开发者模式

```bash
# 安装依赖
npm install

# 启动开发服务器 + Python 后端
npm run dev:web

# 或使用 Electron
npm run dev
```

### 方式三：分享给他人

1. 删除 `node_modules/` 文件夹
2. 把整个文件夹打包发给对方
3. 对方双击 `启动墨笺-免构建.bat` 即可使用（只需 Python 3）

## 📱 Android 版本

```bash
# 构建前端
npm run build

# 同步到 Android 项目
npx cap sync android

# 用 Android Studio 打开 android/ 目录，Build → Build APK
```

## 🛠 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Tailwind CSS + Framer Motion |
| 桌面端 | Electron 42 |
| 移动端 | Capacitor (Android) |
| 后端 | Python 3 标准库（无第三方依赖） |
| AI | DeepSeek API |
| 图标 | Lucide React |

## 📁 项目结构

```
diary-app/
├── src/                     # React 源码
│   ├── components/          # UI 组件（Calendar, Editor, SettingsModal...）
│   ├── hooks/               # useJournal 数据钩子
│   ├── lib/                 # 存储层、API 调用、预设人格
│   ├── context/             # 主题上下文
│   └── styles/              # Tailwind + 自定义 CSS
├── electron/                # Electron 主进程 & preload
├── presets/                 # 预设人格 txt 文件
├── server.py                # Python 后端（API + 静态文件服务）
├── 启动墨笺-免构建.bat       # 一键启动脚本（仅需 Python）
└── capacitor.config.ts      # Capacitor 移动端配置
```

## ⚠️ 注意事项

- 需要 DeepSeek API Key（在[platform.deepseek.com](https://platform.deepseek.com/api_keys) 获取）
- 日记数据存储在 `%APPDATA%/mojian/`（Windows）或 `~/.config/mojian/`（其他系统）
- API Key 和所有日记数据完全本地存储，不会上传

## 👤 作者

**Harlemonica**

## 📄 License

MIT License

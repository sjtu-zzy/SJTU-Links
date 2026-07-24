
<h1 align="center">交我导（SJTU Links）</h1>

<p align="center">
  上海交通大学网站、微信公众号与学生社团导航平台
</p>

<p align="center">
  一个简洁、美观、响应式的校园资源导航网站，帮助师生快速访问学校网站、微信公众号与学生社团资料。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-orange" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-blue" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-ES6-yellow" alt="JavaScript">
  <img src="https://img.shields.io/badge/Responsive-Mobile-success" alt="Responsive">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

---

## 📖 项目简介

**交我导（SJTU Links）** 是一个面向上海交通大学师生打造的校园资源导航网站。

项目收录了学校官方网站、学院网站、行政部门、科研机构、附属医院、公共服务平台、微信公众号与学生社团等资源，并提供搜索、分类浏览、中英文切换、深浅色模式、AI 助手等功能。

本项目采用 **原生 HTML + CSS + JavaScript** 开发，无需任何前端框架。导航功能可直接部署至 GitHub Pages、Cloudflare Pages、Vercel 等静态网站托管平台；AI 助手需要额外部署 Cloudflare Pages Functions 并配置模型环境变量。

---

## ✨ 在线体验


```
https://sjtu-links.pages.dev/
```

---

# 🖼️ 项目截图

## 首页

<p align="center">
  <img src="docs/home.png" width="95%">
</p>

---

## AI 助手

<p align="center">
  <img src="docs/chat.png" width="95%">
</p>

---

## 深色模式

<p align="center">
  <img src="docs/dark.png" width="95%">
</p>

---

## 手机端

<p align="center">
  <img src="docs/mobile.png" width="40%">
</p>

---

# ✨ 功能特点

## 🔍 智能搜索

- 实时关键词搜索
- 名称优先匹配
- 描述匹配
- 分类联合筛选

---

## 📂 分类导航

支持按类别浏览：

- 学校主页
- 学院
- 行政部门
- 科研机构
- 附属医院
- 公共服务
- 微信公众号
- 更多分类

---

## 🌐 中英文切换

支持：

- 简体中文
- English

界面与数据均可切换。

---

## 🌙 深浅色主题

支持：

- 浅色模式
- 深色模式
- 跟随系统

自动保存用户偏好。

---

## 🤖 AI 助手

集成基于工具调用的小型目录 Agent。页面中的 303 条资源会被编译为统一知识文件，模型通过 `grep_directory` 工具检索事实后再回答，不再依赖前端候选或模型记忆猜测。

模型接口需要兼容 OpenAI Chat Completions 与 function/tool calling，例如：

- GPT
- DeepSeek
- Qwen
- Claude（兼容接口）
- 其他支持工具调用的 OpenAI Compatible API

Agent 可以统一查询网站、学院、职能部门、常用系统、微信公众号与社团的名称、网址、用途、星级和联系方式。目录未命中时会明确提示，不会补造资料。

---

## 🎭 社团导航

- 独立的社团类型筛选
- 五星、四星、三星、其他社团筛选
- 社团官网直达
- 微信公众号名称复制
- QQ 群号复制与时效提示
- AI 助手通过统一目录工具查询社团联系方式

---

## 🐦 导导（互动宠物）

网站内置校园吉祥物 **导导**：

- 可拖拽移动
- 自动悬停
- 飞行动画
- 气泡提示
- 一键召回

增加网站趣味性。

---

## 📱 响应式设计

适配：

- Windows
- macOS
- Linux
- Android
- iPhone
- iPad

移动端拥有独立布局优化。

---

## 📄 无限滚动

支持：

- 初始加载五行
- 接近页面底部时静默加载
- 搜索和筛选后自动重置列表
- 桌面与移动端按列数计算批次

---

## ⚡ 性能优化

- 原生 JavaScript
- 无第三方框架
- 无数据库
- 页面加载速度快
- 支持静态部署

---

# 📂 项目结构

```text
.
├── docs/
│   ├── home.png             # README 首页截图
│   ├── chat.png             # AI 助手截图
│   ├── dark.png             # 深色模式截图
│   └── mobile.png           # 移动端截图
│
├── functions/
│   ├── chat.js                         # 目录 Agent 编排
│   ├── directory-search.js             # grep_directory 工具
│   └── directory-knowledge.generated.js # 编译后的统一目录知识
│
├── scripts/
│   └── compile-directory-knowledge.mjs # 目录知识编译器
│
├── index.html                          # 网站入口
├── 交我导数据.js                        # 网站与公众号数据
├── 交我导社团数据.js                     # 社团导航数据
├── README.md
└── LICENSE
```

---

# 🚀 快速开始

## 1. 克隆仓库

```bash
git clone https://github.com/你的用户名/仓库名.git
```

---

## 2. 进入目录

```bash
cd 仓库名
```

---

## 3. 打开网站

直接双击

```
index.html
```

即可运行。

或者使用：

```bash
python -m http.server
```

浏览器访问：

```
http://localhost:8000
```

## 本地测试 AI Agent

AI 助手需要使用 Wrangler 启动 Pages Functions，不能只用 `python -m http.server`。

1. 复制 `.dev.vars.example` 为 `.dev.vars`，填写 `AI_API_KEY`、`AI_API_URL` 和支持工具调用的 `AI_MODEL`。
2. 使用以下命令启动本地 Pages：

```bash
wrangler pages dev . \
  --port 8788 \
  --compatibility-date 2026-05-01 \
  --env-file .dev.vars
```

3. 打开 `http://127.0.0.1:8788/`，或直接请求 `http://127.0.0.1:8788/chat`。

`.dev.vars` 已加入 `.gitignore`，不要提交其中的密钥。当前 Agent 要求模型兼容 OpenAI Chat Completions 的 `tools` / function calling。

---

# 🌐 GitHub Pages 部署

进入仓库：

```
Settings
    ↓
Pages
    ↓
Deploy from a branch
    ↓
main
    ↓
/root
```

等待数分钟即可自动发布。

---

# 📋 数据格式

所有导航数据均位于：

```
交我导数据.js
```

网站示例：

```javascript
{
    name: "上海交通大学",
    name_en: "Shanghai Jiao Tong University",
    cat: "学校",
    cat_en: "University",
    desc: "上海交通大学官方网站",
    desc_en: "Official Website",
    type: "website",
    url: "https://www.sjtu.edu.cn"
}
```

公众号示例：

```javascript
{
    name: "上海交通大学",
    cat: "学校",
    type: "wechat"
}
```

社团示例：

```javascript
{
    name: "国学社",
    name_en: "国学社",
    type: "club",
    cat: "五星社团",
    cat_en: "Five-star Clubs",
    rating: 5,
    websiteUrl: "https://sjtuguoxue.space/",
    wechatName: "上海交大国学社",
    qqGroups: ["709881123"],
    qqNote: null
}
```

社团资料为一次性整理快照，星级和联系方式日期记录在 `交我导社团数据.js` 的 `JIAOWODAO_CLUB_META` 中。QQ群信息可能过时，使用前请再次核对。

修改数据后，页面刷新即可生效；要让 AI Agent 同步使用最新目录，还需重新编译知识文件：

```bash
node scripts/compile-directory-knowledge.mjs
```

提交前可以检查编译产物是否为最新版本：

```bash
node scripts/compile-directory-knowledge.mjs --check
```

编译器会校验数据结构、重复名称、HTTP(S) URL、社团数量、星级与 QQ 格式，并生成 `functions/directory-knowledge.generated.js`。它不会联网，也不会同步上游社团资料。

---

# 🛠️ 技术栈

- HTML5
- CSS3
- JavaScript (ES6)
- LocalStorage
- SVG
- Responsive Design
- Cloudflare Pages Functions（可选，用于 AI 助手）
- OpenAI-compatible function/tool calling（AI 助手需要）

导航页面无需：

- Node.js
- npm
- Vue
- React
- 数据库
- 常驻后端服务器

---

# 💻 浏览器支持

| 浏览器 | 支持 |
|---------|------|
| Chrome | ✅ |
| Edge | ✅ |
| Firefox | ✅ |
| Safari | ✅ |
| Android 浏览器 | ✅ |
| iOS Safari | ✅ |

推荐使用最新版浏览器。

---

# 🗺️ Roadmap

未来计划增加：

- [ ] 收藏夹
- [ ] 最近访问
- [ ] 网站访问统计
- [ ] 标签系统
- [ ] 更多校园资源收录
- [ ] PWA 支持
- [ ] 离线缓存
- [ ] 多主题配色

---

# 🤝 贡献

欢迎通过以下方式参与项目建设：

- 提交 Issue
- 提交 Pull Request
- 补充校园网站
- 补充微信公众号
- 提出功能建议

任何贡献都十分欢迎！

---

# ⚠️ 声明

本项目为非官方校园导航项目，仅供学习、交流与校园信息整合使用。

网站链接及微信公众号信息均来源于公开资料，相关内容版权归原网站及公众号所有，如有遗漏或错误，欢迎反馈。

---

# 📄 License

本项目采用 **MIT License** 开源。

```
MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files...
```

---

<p align="center">

如果这个项目对你有所帮助，欢迎点一个 ⭐ Star！

Made with ❤️ for SJTU

</p>

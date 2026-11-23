# CoreForge · PC 装机配置平台

一个类 [BuildCores](https://www.buildcores.com/) 风格的 PC 装机配置网站，使用 **Vite + Vue 3** 搭建。支持硬件浏览、参数筛选、3D 装机预览、配置单构建、兼容性检查、登录与背景音乐。

## ✨ 功能特性

- **八大硬件品类**：CPU、主板、显卡、内存、存储、电源、散热、机箱，共 60 款配件
- **卡片式硬件展示**：品牌、型号、核心参数、评分与评价数、价格
- **多维度筛选**：分类切换、品牌勾选、价格区间、排序（价格 / 评分）
- **配件详情页**：点击卡片查看完整参数表
- **3D 装机预览**：基于 Three.js 的机箱与配件实时预览，支持旋转缩放、RGB 灯效、机箱外观随选择变化
- **配置单构建器**：分步流程（CPU→主板→…→机箱），实时汇总总价与预估功耗
- **兼容性检查引擎**：CPU 插槽、内存类型、电源瓦数、显卡长度、散热高度等 6 项规则，选错即时红色警示
- **配置单导出**：一键复制为文本 / 下载为 .txt
- **登录 / 注册**：纯前端演示版登录（表单校验 + 模拟鉴权）
- **提建议**：弹窗表单
- **黑白主题切换**：全站深浅色主题
- **背景音乐播放器**：右下角悬浮播放器 + 欢迎页，进入网站自动播放
- **响应式布局**：桌面端与移动端自适应

## 🛠 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Vue 3（`<script setup>` 组合式 API） |
| 构建工具 | Vite 8 |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| 样式 | Tailwind CSS 4 |
| 3D 渲染 | Three.js |
| 代码规范 | ESLint + Prettier |

## 📁 目录结构

```
pc-builder/
├── src/
│   ├── data/
│   │   ├── categories.js           # 硬件分类定义
│   │   └── parts.js                # 本地假数据（60 款配件）
│   ├── stores/
│   │   ├── parts.js                # 配件库：筛选 / 排序
│   │   ├── build.js                # 配置单：选择 / 汇总 / 兼容性
│   │   ├── auth.js                 # 登录状态
│   │   ├── theme.js                # 黑白主题
│   │   └── welcome.js              # 欢迎页状态
│   ├── router/
│   │   └── index.js                # 路由配置
│   ├── utils/
│   │   └── compatibility.js        # 兼容性规则引擎（纯函数）
│   ├── components/
│   │   ├── NavBar.vue              # 顶部导航栏
│   │   ├── CategoryIcon.vue        # 内联 SVG 分类图标
│   │   ├── PartCard.vue            # 硬件卡片
│   │   ├── FilterSidebar.vue       # 筛选侧栏
│   │   ├── BuildPreview3D.vue      # 3D 装机预览
│   │   ├── MusicPlayer.vue         # 音乐播放器
│   │   ├── WelcomeOverlay.vue      # 欢迎页
│   │   └── SuggestionModal.vue     # 提建议弹窗
│   ├── views/
│   │   ├── HomeView.vue            # 首页（Hero + 品类卡片）
│   │   ├── PartsView.vue           # 硬件列表页
│   │   ├── PartDetailView.vue      # 配件详情页
│   │   ├── BuildView.vue           # 配置单构建器
│   │   └── LoginView.vue           # 登录 / 注册页
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── public/
│   ├── music/                      # 音乐文件（背景音乐）
│   └── favicon.svg
├── index.html
├── vite.config.js                  # 路径别名 @、Tailwind 插件
├── eslint.config.js
└── .prettierrc.json
```

## 🚀 快速开始

### 环境要求

- Node.js 18+

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器访问 http://localhost:5173/ 即可查看。

### 其他命令

```bash
npm run build      # 生产构建
npm run preview    # 预览生产构建
npm run lint       # 代码检查
npm run format     # 代码格式化
```

## 🎵 音乐文件说明

- 背景音乐文件位于 `public/music/` 目录
- 播放列表配置在 `src/components/MusicPlayer.vue` 顶部的 `playlist` 数组
- 若需更换音乐，替换 `public/music/` 下的音频文件，并修改 `playlist` 中的 `file` 字段
- 建议使用 mp3 格式（flac 在 Safari 上可能不兼容）

## 📝 数据说明

- 当前所有硬件数据位于 `src/data/parts.js`，为**本地模拟数据**，仅用于演示。
- 每条配件记录已预留兼容性字段（CPU 的 `socket`/`tdp`、主板的 `memoryType`、内存的 `memoryType`、显卡的 `length`/`powerDraw`、电源的 `wattage`、散热的 `coolerHeight`/`coolingCapacity`、机箱的 `maxGpuLength`/`maxCoolerHeight`）。
- 兼容性规则引擎位于 `src/utils/compatibility.js`，为独立纯函数，方便后续迁移到后端。

## 🗺 完成情况

- [x] 项目初始化与工程化配置
- [x] 本地假数据层（60 款配件）
- [x] 硬件列表页与筛选排序
- [x] 配件详情页
- [x] 3D 装机预览
- [x] 配置单构建器（实时价格汇总）
- [x] 兼容性规则引擎
- [x] 配置单导出分享
- [x] 登录 / 注册界面
- [x] 提建议弹窗
- [x] 黑白主题切换
- [x] 背景音乐播放器
- [ ] 后端 API 与数据库接入（后续可扩展）

## 📄 License

本项目仅用于学习与作业演示。
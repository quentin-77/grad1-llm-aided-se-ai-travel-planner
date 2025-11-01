# 旅策同行 · AI Travel Planner

> 通过语音与大语言模型协同，自动生成智能行程、费用预算与地图导航的旅行助手。当前处于基础骨架阶段。

## 项目愿景

- **语音快速输入**：支持中文/英文语音录入旅行意图，自动转写并填充表单。
- **AI 行程生成**：基于通义千问等模型生成每日行程、交通、住宿与餐饮建议。
- **预算管理**：结合 AI 预算估算与手动/语音录入，实时跟踪花费。
- **云端同步**：使用 Supabase 保存用户、行程与费用数据，多端实时同步。
- **地图交互**：集成高德地图展示路线、景点 POI 与推荐导航。

## 当前进度

- ✅ Next.js 16 + TypeScript + Tailwind UI 框架搭建
- ✅ 规划、行程、费用、设置等页面骨架完成
- ✅ Supabase 客户端封装、React Query 全局状态配置
- ✅ 语音输入组件与行程申请表单原型
- ✅ API Route 占位（行程生成 / 语音识别 / 费用管理）
- ⏳ 即将接入：通义千问行程生成、阿里云语音识别、高德地图可视化、Supabase Auth

## 技术栈

- **前端**：Next.js 16（App Router）、React 19、TypeScript、Tailwind CSS 4
- **状态管理**：React Query、React Hook Form、Zod
- **音频与地图**：MediaRecorder API、阿里云智能语音交互（计划）、高德地图 JS SDK（计划）
- **后端服务**：Supabase（Auth + Database + Storage）、Next.js Route Handlers
- **AI 能力计划**：阿里云百炼 DashScope（通义千问）、语音识别 API

## 快速开始

### 1. 环境准备

- Node.js ≥ 20（推荐配合 `corepack` 使用 pnpm）
- pnpm ≥ 8（`corepack enable` 后自动安装）

### 2. 安装依赖

```bash
pnpm install
```

### 3. 运行开发环境

```bash
pnpm dev
```

访问 `http://localhost:3000`，默认重定向至 `/planner` 行程规划页。

### 4. 代码质量

```bash
pnpm lint      # ESLint
pnpm typecheck # TypeScript 检查
```

## 环境变量

在根目录创建 `.env.local` 并按需填写（所有密钥仅供本地/部署时使用，**切勿提交到 Git**）：

```bash
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_JWT_SECRET=""

DASH_SCOPE_API_KEY=""
ALIBABA_SPEECH_APP_ID=""
ALIBABA_SPEECH_ACCESS_KEY_ID=""
ALIBABA_SPEECH_ACCESS_KEY_SECRET=""
AMAP_WEB_KEY=""
```

后续将在前端设置页面提供 Key 输入界面，同时通过 Supabase 安全存储，避免硬编码在仓库中。

## 目录结构

```
ai-travel-planner
├── app
│   ├── (routes)
│   │   ├── expenses
│   │   ├── plan
│   │   ├── planner
│   │   └── settings
│   ├── api
│   │   ├── expenses
│   │   ├── plan
│   │   └── speech
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── forms
│   ├── layout
│   ├── navigation
│   ├── plan
│   ├── planner
│   ├── providers
│   ├── speech
│   └── ui
├── lib
│   ├── config
│   ├── supabase
│   ├── types
│   └── utils
└── README.md
```

## 里程碑规划

1. **基础设施**（当前阶段）
   - 完成项目结构、UI 框架、API 占位与状态管理配置。
2. **核心功能**
   - 接入通义千问生成行程 + 预算；集成阿里云语音识别；高德地图展示路线。
   - Supabase Auth / DB 建模，支持行程与费用的云端存储与同步。
3. **体验与部署**
   - 打造图表与地图交互体验；完善设置页、错误提示与日志。
   - Docker 镜像、GitHub Actions 自动构建与发布；编写 PDF 汇总文档。

---

欢迎基于当前骨架继续扩展，完成完整的智能旅行助手。后续开发请保持密钥安全与提交颗粒度。祝顺利！

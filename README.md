# 旅策同行 · AI Travel Planner

> 通过语音与大语言模型协同，自动生成智能行程、费用预算与地图导航的旅行助手。当前处于基础骨架阶段。

## 项目愿景

- **语音快速输入**：支持中文/英文语音录入旅行意图，自动转写并填充表单。
- **AI 行程生成**：基于通义千问等模型生成每日行程、交通、住宿与餐饮建议。
- **预算管理**：结合 AI 预算估算与手动/语音录入，实时跟踪花费。
- **云端同步**：使用 Supabase 保存用户、行程与费用数据，多端实时同步。
- **地图交互**：集成高德地图展示路线、景点 POI 与推荐导航。

## 当前进度

- ✅ Next.js 16 + TypeScript + Tailwind UI 框架与导航骨架
- ✅ 行程规划工作台（表单校验、React Query 状态、语音录入）
- ✅ `/api/plan` 接入 DashScope 调用骨架（无 Key 时自动降级示例行程）
- ✅ `/api/plan/intent` 语音文本解析 → 行程表单自动填充（DashScope / 规则双方案）
- ✅ `/api/speech` 语音识别通道（占位返回，提示补充阿里云密钥）
- ✅ 行程预览：预算占比图 + 高德地图地图组件（缺少坐标/Key 时提示）
- ⏳ 下一步：语音落地表单解析、Supabase Auth / DB 接入、费用模块联动

## 技术栈

- **前端**：Next.js 16（App Router）、React 19、TypeScript、Tailwind CSS 4
- **状态管理**：React Query、React Hook Form、Zod
- **音频与地图**：MediaRecorder API、阿里云智能语音交互（待接入）、高德地图 JS SDK
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
DASH_SCOPE_MODEL=""
ALIBABA_SPEECH_APP_ID=""
ALIBABA_SPEECH_ACCESS_KEY_ID=""
ALIBABA_SPEECH_ACCESS_KEY_SECRET=""
AMAP_WEB_KEY=""
NEXT_PUBLIC_AMAP_WEB_KEY=""
```

> `DASH_SCOPE_MODEL` 默认为 `qwen-plus`，如只开通试用可改为 `qwen-turbo`；`AMAP_WEB_KEY` 用于服务端调用，`NEXT_PUBLIC_AMAP_WEB_KEY` 在前端地图 SDK 中使用。若暂未申请，可留空，界面会显示友好的提示。

后续将在前端设置页面提供 Key 输入界面，同时通过 Supabase 安全存储，避免硬编码在仓库中。

## 智能行程规划流程

1. **语音/文字录入**：使用顶部语音按钮或手动输入需求；语音结果会展示在侧边卡片。
2. **语义解析**：点击“解析并填充表单”，调用 `/api/plan/intent`。
   - 配置 `DASH_SCOPE_API_KEY` 时，由通义千问输出结构化行程意图；
   - 未配置时，启用规则解析，自动推测目的地/天数/预算/同行人群/偏好。
3. **确认参数**：表单可二次编辑修正日期、预算、主题等信息。
4. **生成行程**：提交后触发 `/api/plan`，
   - 配置 DashScope 时，直接返回模型生成的行程与预算；
   - 未配置时，提供示例行程，仍能驱动 UI 流程（预算图表 + 地图提示）。
5. **结果展示**：
   - 行程亮点、每日安排、预算分配饼图；
   - 地图组件根据坐标展示 POI（无坐标/Key 时友好提示）；
   - 标记数据来源（通义千问或占位）。

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

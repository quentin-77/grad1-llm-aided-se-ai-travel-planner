# VoyageAI · AI 旅航

AI 规划，超乎所想。Travel That Understands You.

通过语音与大语言模型协同，自动生成智能行程、费用预算与地图导航的旅行助手。

## 功能特性

- 智能规划：语音或文字描述旅行需求，快速生成个性化行程（目的地、天数、主题、预算等）。
- 云端行程库：行程保存在云端，可列表查看、详情查看与删除，地图与 POI 同步展示。
- 预算洞察：生成阶段给出预算分配；旅途中支持语音/手动记账，对比预估与实际开销。
- 语音交互：内置语音识别，支持阿里云识别或浏览器 Web Speech（自动降级）。
- 个性化偏好：设置旅行主题、默认预算与币种，规划表单自动预填，越用越懂你。
- 安全访问控制：基于 Supabase RLS 的用户级数据隔离，仅能访问自己的数据。

## 技术栈

- 前端：Next.js 16（App Router）、React 19、TypeScript、Tailwind CSS 4
- 状态与表单：TanStack Query、React Hook Form、Zod
- 音频与地图：MediaRecorder API、高德地图 JS SDK
- 后端与数据：Next.js Route Handlers、Supabase（Auth/DB/Storage）
- AI 能力：阿里云百炼 DashScope（通义千问）、阿里云语音识别 API

## 快速开始

### 步骤 1：获取代码并配置环境

1. 克隆仓库

```bash
git clone https://github.com/quentin-77/grad1-llm-aided-se-ai-travel-planner
cd ai-travel-planner
```

2. 配置环境变量  
本项目的所有 API 密钥均通过 `.env` 文件管理。

```bash
# 复制环境变量模板
cp .env.example .env
```

然后，打开 `.env` 文件并填入所需的 API 密钥。

> 必填项说明：
>
> ```bash
> # Supabase（用于登录和保存数据）
> NEXT_PUBLIC_SUPABASE_URL=
> NEXT_PUBLIC_SUPABASE_ANON_KEY=
>
> # Supabase（用于后端管理操作）
> SUPABASE_SERVICE_ROLE_KEY=
> SUPABASE_JWT_SECRET=
>
> # 阿里云通义千问（AI）
> DASH_SCOPE_API_KEY=
>
> # AI 模型配置
> DASH_SCOPE_MODEL=qwen-turbo
> DASH_SCOPE_TIMEOUT_MS=60000
>
> # 阿里云语音识别（未配置时前端尝试 Web Speech API）
> ALIBABA_SPEECH_APP_ID=
> ALIBABA_SPEECH_ACCESS_TOKEN=
> ALIBABA_SPEECH_ACCESS_KEY_ID=
> ALIBABA_SPEECH_ACCESS_KEY_SECRET=
> ALIBABA_NLS_APP_KEY=
> ALIBABA_SPEECH_REGION=cn-shanghai
>
> # 高德地图（前端 JS Key 与后端 Web 服务 Key）
> AMAP_WEB_KEY=
> NEXT_PUBLIC_AMAP_WEB_KEY=
> ```
>
> 降级说明：未配置 Supabase 时，应用以“本地演示模式”运行（无登录、无云端保存）。未配置阿里云语音时，前端尝试 Web Speech API。

---

### 步骤 2：启动应用（二选一）

#### 选项 A：本地构建并运行

此方法使用仓库内 `Dockerfile` 与 `docker-compose.yml`。

```bash
# -d 后台运行；--build 使用最新代码构建
docker compose up --build -d
```

Docker Compose 会自动读取 `.env` 文件，传入 `NEXT_PUBLIC_*` 等变量并启动容器。

#### 选项 B：拉取预构建的云端镜像

由 GitHub Actions 自动构建并推送至阿里云 ACR 的镜像。

1. 拉取镜像（将 <IMAGE_URL> 替换为你的 ACR 镜像地址）

```bash
docker pull <IMAGE_URL>:latest
# docker pull --platform linux/amd64 crpi-knzvyjdnous12lp3.cn-hangzhou.personal.cr.aliyuncs.com/weiqi-projects/ai-travel-planner:latest
```

2. 运行镜像（需在当前目录准备好 `.env` 文件）

```bash
# --env-file .env 会将所有密钥安全注入容器
docker run --rm -p 3000:3000 --env-file .env <IMAGE_URL>:latest
# docker run --rm -p 3000:3000 --env-file .env crpi-knzvyjdnous12lp3.cn-hangzhou.personal.cr.aliyuncs.com/weiqi-projects/ai-travel-planner:latest
```
---
### 步骤 3：访问应用
启动成功后，打开浏览器访问： http://localhost:3000

## 本地开发
1) 环境要求
- Node.js ≥ 20（推荐 `corepack enable` 后使用 pnpm）
- pnpm ≥ 8

2) 安装依赖
```bash
pnpm install
```

3) 配置环境变量
- 复制 `.env.example` 为 `.env.local`（本地开发）或 `.env`（容器/生产），并按需填写；见下文“环境变量说明”。

4) 本地开发
```bash
pnpm dev
```
访问 `http://localhost:3000`（默认跳转至 `/planner`）。

5) 代码质量
```bash
pnpm lint      # ESLint
pnpm typecheck # TypeScript 类型检查
```


## 使用说明

- 身份认证与路由保护：
  - 登录/注册：`/login`、`/signup`；右上角可登出。
  - 未登录访问 `/planner`、`/plan`、`/expenses`、`/settings` 将跳转登录。
- 行程规划流程：
  - 语音或文字录入 → 点击“解析并填充表单”（`/api/plan/intent`） → 确认/编辑参数 → 生成行程（`/api/plan`）。
  - 结果包含：行程亮点、每日安排、预算分配图表、地图 POI（缺少 Key 或坐标时有友好提示）。
  - 点击“保存此计划”写入 `travel_plans`；“我的行程”列表支持查看与删除。
- 费用管理：
  - 在“费用管理”页面或行程详情页记账/查看/删除；支持语音录入（如“午餐 68 元”、“地铁 3 块”）。
- 个性化偏好：
  - 在“设置”配置旅行主题、默认预算与币种；进入“智能行程规划”时自动预填。
  - 预算建议映射（可自定义）：节省≈5000，中等≈10000，宽松≈20000。
  
## 数据库结构（Supabase）

在 Supabase SQL Editor 运行 `supabase/schema.sql` 可初始化数据库：
- `travel_plans`：存储用户保存的旅行计划（含 `plan_data` JSON）。
- `user_preferences`：存储用户的个性化偏好。
- `expenses`：存储与 `travel_plans` 关联的单笔记账。

所有表均已启用 RLS（行级安全），仅允许读写自己的数据，确保用户数据隔离。

## CI/CD（GitHub Actions）

仓库已配置 GitHub Actions（`.github/workflows/docker.yml`），用于在 `main` 分支 push 时自动执行：
1. 登录 阿里云 ACR (需配置 ACR_* Secrets)。
2. 构建 Docker 镜像（使用 Dockerfile）。
3. 注入 NEXT_PUBLIC_* 构建时参数 (需配置同名 Secrets)。
4. 推送 镜像到您的 ACR 仓库。
推送产物即为“选项 B”中可拉取的云端镜像。

## 目录结构

```
ai-travel-planner
├── app
│   ├── (routes)
│   │   ├── planner           # 智能行程规划
│   │   ├── plan              # 行程列表与详情（含 [id]）
│   │   ├── expenses          # 费用管理
│   │   └── settings          # 偏好设置
│   ├── api                   # Next.js Route Handlers
│   │   ├── plan[/intent]     # 计划生成与意图解析
│   │   ├── travel-plans[/id] # 行程 CRUD
│   │   ├── expenses[/id]     # 费用 CRUD
│   │   ├── preferences       # 偏好保存
│   │   ├── speech/file       # 语音文件处理
│   │   └── map-*             # 地图相关服务
│   ├── layout.tsx            # 全局布局
│   └── page.tsx              # 入口（重定向）
├── components                # UI、表单、地图、语音等组件
├── lib                       # 配置、类型、工具、Supabase 客户端
├── middleware.ts             # 路由保护
├── supabase/schema.sql       # 数据库表结构与 RLS 策略
└── Dockerfile / docker-compose.yml
```

# VoyageAI · AI 旅航

> AI 规划，超乎所想。Travel That Understands You.

通过语音与大语言模型协同，自动生成智能行程、费用预算与地图导航的旅行助手。

## 项目愿景

- 智能规划 | 从灵感到落地：告别繁琐的攻略搜索。只需通过语音或文字描述您的旅行愿景——无论是预算、天数还是“美食与亲子”等偏好——AI 立即构建个性化行程方案，让灵感即刻成为现实。
- 云端行程库 | 一处掌控，多端同步：所有计划安全保存在云端，可统一管理、编辑或删除；地点（POI）与交互式地图实时同步，路线一目了然。
- AI 预算洞察 | 告别超支焦虑：规划之初提供预算分析；旅途中通过语音（如“晚餐150元”）或手动录入实时追踪开销，对比预估与实际，做到心中有数。
- 个性化档案 | 打造您的专属 AI：管理账户与旅行偏好。偏好越多，AI 越懂您，下次规划更精准高效。

## 当前进度

- ✅ Next.js 16 + TypeScript + Tailwind UI 框架与导航骨架
- ✅ 行程规划工作台（表单校验、React Query 状态、语音录入）
- ✅ `/api/plan` 调用骨架（无 Key 时提供示例行程）
- ✅ `/api/plan/intent` 语音文本解析 → 行程表单自动填充（DashScope / 规则双方案）
- ✅ 行程预览：预算占比图 + 地图组件（缺少坐标/Key 时提示）
- ✅ Supabase 集成：认证、路由保护、行程/费用/偏好持久化
  - 认证：登录 `/login`、注册 `/signup`、登出（右上角）
  - 路由保护：未登录访问私有路由会被重定向到 `/login`
  - 行程：保存（生成后“保存此计划”）、列表/删除（“我的行程”）
  - 偏好：在“设置中心”保存旅行类型、默认预算、默认币种；进入规划页自动预填
  - 费用：在“行程详情/费用管理”录入与删除；支持语音填表

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

访问 `http://localhost:3000`，默认重定向至 `/planner`（智能规划）。

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
DASH_SCOPE_TIMEOUT_MS=""
ALIBABA_SPEECH_APP_ID=""
ALIBABA_SPEECH_ACCESS_TOKEN=""
ALIBABA_SPEECH_ACCESS_KEY_ID=""
ALIBABA_SPEECH_ACCESS_KEY_SECRET=""
ALIBABA_SPEECH_REGION="cn-shanghai"
AMAP_WEB_KEY=""
NEXT_PUBLIC_AMAP_WEB_KEY=""
```

> `DASH_SCOPE_MODEL` 默认为 `qwen-turbo`（推荐，更快且成本更低）；如具备高规格权限可切换到 `qwen-plus`。`DASH_SCOPE_TIMEOUT_MS` 可自定义调用超时（毫秒），默认 60 秒。语音识别目前支持阿里云或浏览器内置 Web Speech API：配置 `ALIBABA_*` 变量即可启用阿里云后端识别；未配置时，前端可尝试 Web Speech（受浏览器/网络限制），否则降级为占位 mock。`ALIBABA_SPEECH_REGION` 需与你开通的地域一致。`AMAP_WEB_KEY` 用于服务端调用，`NEXT_PUBLIC_AMAP_WEB_KEY` 在前端地图 SDK 中使用。若暂未申请，可留空，界面会显示友好的提示。

Supabase 相关变量用于认证与数据库访问；若未配置，将跳过鉴权拦截。阿里云/地图等密钥后续可通过安全方式提供。

### 初始化 Supabase 数据库

在 Supabase SQL Editor 执行 `supabase/schema.sql`，将创建以下表与 RLS 策略：

- `travel_plans(id, user_id, plan_name, plan_data jsonb, created_at)`
- `user_preferences(user_id unique, themes text[], default_budget text, currency text)`
- `expenses(id, user_id, plan_id, title, amount numeric, currency, created_at)`

所有表启用 RLS，仅允许用户访问/修改自己的数据。

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

6. **保存与管理**：
   - 生成后点击“保存此计划”写入云端；
   - 在“我的行程”查看与删除；
   - 进入具体行程可在“费用管理”里记账与查看。

> 语音识别注意：阿里云实时听写仅支持 16kHz / 16bit / 单声道 的 WAV 或 PCM 音频。建议在前端使用 Web Audio API 将 `MediaRecorder` 录制的 `audio/webm` 转换为 WAV 后再上传，否则接口会报 `NO_VALID_AUDIO_ERROR`。

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
│   │   │   └── [id]
│   │   ├── preferences
│   │   ├── travel-plans
│   │   ├── plan
│   │   └── speech
│   ├── layout.tsx # 全局样式
│   ├── layout.tsx # 全局布局
│   └── page.tsx # 页面组件
├── middleware.ts # 路由保护（Next 16 兼容）
├── components
│   ├── forms
│   ├── layout
│   ├── navigation
│   ├── plan
│   ├── plan_expenses
│   ├── planner
│   ├── expenses
│   ├── providers
│   ├── speech
│   └── ui
├── lib
│   ├── config
│   ├── supabase
│   ├── types
│   └── utils
├── supabase
│   └── schema.sql # 数据库表结构与 RLS 策略
└── README.md
```

## 使用说明（Supabase 相关）

- 登录/注册：`/login`、`/signup`。右上角可登出。
- 路由保护：未登录访问 `/planner`、`/plan`、`/expenses`、`/settings` 会跳转登录。
- 行程
  - 生成后“保存此计划”写入到 `travel_plans`
  - “我的行程”列表展示当前用户的计划，可删除
  - 行程详情页展示计划内容，并带“费用管理”面板
- 偏好
  - 设置中心仅保留“个性化偏好”（旅行类型、默认预算、默认币种）
  - 进入“智能行程规划”时自动预填相应表单默认值
  - 默认预算映射（可按需调整）：节省≈5000，中等≈10000，宽松≈20000
- 费用
  - 在“费用管理”可按行程记一笔/查看/删除
  - 在行程详情页的“费用管理”也可针对该行程记账
  - 语音录入：说“午餐 68 元”、“地铁 3 块”等自动填充表单

## 开发者提示（Next.js 16）

- 动态路由的 `params` 在 App Router 中为 Promise，需先 `await` 后再使用其属性。
- 中间件在 Next 16 有 Proxy 新约定；本项目仍使用 `middleware.ts` 进行鉴权拦截，后续可视需要迁移。

---

欢迎基于当前骨架继续扩展，完成完整的智能旅行助手。后续开发请保持密钥安全与提交颗粒度。祝顺利！

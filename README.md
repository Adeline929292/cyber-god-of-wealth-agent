# 赛博财神爷（Cyber Caishen）PoC

一个“反冲动消费 + 攒钱目标”的理财陪伴 Agent PoC：你输入想买的东西（带价格），系统会做 **mock 底价对比**、**目标影响计算**，并以“赛博财神 / 毒舌闺蜜”的风格给出 **劝退/鼓励/中立**建议；若被劝退，会自动写入 **冷静清单**，支持后续查看与勾选。

## 功能概览（已实现）

### 页面（Next.js）
- 首页 `/`：项目入口 + 后端连通状态 + **一键演示**（自动准备默认目标并跳转到聊天预填示例）+ 最近劝退摘要
- 聊天页 `/chat`：左侧消息流 + 分析卡片（结论/影响/比价/冷静清单预览）+ 右侧目标卡片（实时读取当前目标）
- 目标页 `/goals`：创建/编辑攒钱目标，展示进度条
- 冷静清单页 `/cooldown`：展示所有被劝退商品列表，查看详情并勾选清单项（会回写后端）

### 后端（FastAPI + SQLite + Alembic）
- 目标 Goals CRUD：创建/更新/读取当前/列表
- 会话 Sessions：进入聊天页自动创建/恢复 session（前端 localStorage）
- Agent Chat（闭环）：输入 → 解析 → mock 比价 → 影响计算 → 决策 → 人格化建议 → 返回结构化结果
- 冷静清单持久化：当决策为 `discourage` 时自动落库，并支持列表/详情/勾选更新
- LLM Provider 预留与可切换演示：
  - `GET /api/llm/providers` 显示 openai/qwen/deepseek 是否已配置 key
  - `/api/chat` 支持 persona 选择 + llm_enabled/provider 参数；未配置 key 时自动降级模板模式（保证可演示）

## 技术栈
- 前端：Next.js（App Router）+ Tailwind CSS + shadcn/ui 风格组件（本仓库内置最小组件集）
- 后端：FastAPI + SQLModel + SQLite + Alembic
- 金额单位：后端统一使用“分”（int），前端展示/输入使用“元”（小数），提交时转换

## 快速启动（Windows / PowerShell）

> 先启动后端，再启动前端。

### 1) 启动后端

```powershell
cd e:\研究生\实习\赛博财神爷\backend

python -m venv venv
.\venv\Scripts\activate

pip install -r requirements.txt

# 迁移到最新（必做）
alembic upgrade head

# 启动 API
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

验证：
- Swagger 文档： http://127.0.0.1:8000/docs
- 健康检查： http://127.0.0.1:8000/api/health

### 2) 启动前端

```powershell
cd e:\研究生\实习\赛博财神爷\frontend

npm install

copy .env.local.example .env.local

npm run dev
```

打开：
- http://localhost:3000

## 演示路径（推荐）

1. 打开首页 http://localhost:3000
2. 点击「一键演示」或「直接演示：盲盒 800」
   - 若没有目标，会自动创建默认目标（日本旅行基金等）
   - 自动跳转到聊天页并预填示例输入
3. 在聊天页点击发送，查看：
   - 结论（劝退/鼓励/中立）+ 人格
   - 目标影响（缺口变化、预计延后天数）
   - 模拟底价对比（多渠道报价 + 最低价 + 可省金额）
   - 冷静清单预览（若劝退）
4. 若为劝退：点击「打开清单」直达 `/cooldown?id=xxx`，可勾选并保存清单项

## 环境变量

### 前端（`frontend/.env.local`）
- `NEXT_PUBLIC_API_BASE_URL`：后端地址（默认 `http://127.0.0.1:8000`）

### 后端（`backend/.env`，可选）
你可以参考 `backend/.env.example`，常用项：
- `DATABASE_URL`：默认 `sqlite:///./data/app.db`
- `CORS_ORIGINS`：默认允许 `http://localhost:3000`

LLM Key（可选，用于“增强模式”演示；不填也能完整跑通）：
- `OPENAI_API_KEY`
- `QWEN_API_KEY`
- `DEEPSEEK_API_KEY`

## 主要 API 一览

- Health
  - `GET /api/health`
- Goals
  - `POST /api/goals`
  - `PATCH /api/goals/{goal_id}`
  - `GET /api/goals/current`
  - `GET /api/goals`
- Sessions
  - `POST /api/sessions`
- Prices（Mock）
  - `GET /api/prices/search?query=xxx`
- Chat / Agent
  - `POST /api/chat`
- Cooldown
  - `GET /api/cooldown/items`
  - `GET /api/cooldown/items/{purchase_intent_id}`
  - `PATCH /api/cooldown/items/{purchase_intent_id}`
- LLM
  - `GET /api/llm/providers`

## 常见问题

- 前端显示 “API 未连接”
  - 确认后端已启动且为 `http://127.0.0.1:8000`
  - 确认 `frontend/.env.local` 的 `NEXT_PUBLIC_API_BASE_URL` 正确
- 冷静清单页没有数据
  - 只有当聊天决策为 `discourage` 才会落库并出现在冷静清单页
  - 先去 `/goals` 设置目标，再到 `/chat` 输入带价格的句子触发一次“劝退”

# 赛博财神爷（Cyber Caishen）PoC - Design（MVP）

## 1. 项目背景

“赛博财神爷”是一个面向个人日常消费决策的反冲动消费与攒钱 Agent PoC。它通过“把一次冲动购买转换成对攒钱目标的可视化影响（时间/进度/机会成本）”的方式，帮助用户在下单前冷静、对比、再决定。

设计目标：

- 可演示：端到端跑通“输入想买的东西 → 看到影响 → 得到人格化建议 → 生成冷静清单”闭环
- 用户体验优先：低操作成本、结果可读、建议有风格但不说教
- 可扩展：LLM 提供商可替换；商品价格检索先 mock，后续可接真实比价/电商搜索

非目标（MVP 不做）：

- 完整记账、银行卡/支付数据接入
- 多端同步、复杂权限与组织
- 真实电商下单链路

## 2. 核心用户流程

### 首次使用（Onboarding）

1. 用户进入首页，看到项目主题与两个按钮：“开始劝退我”“设置攒钱目标”
2. 用户进入“攒钱目标页”设置目标（如：日本旅行基金 10000 元）
3. 系统展示目标进度条与关键数字（已攒/目标、进度百分比）

### 日常使用（反冲动消费）

1. 用户点击首页“开始劝退我”进入聊天页
2. 聊天页为左右布局：
   - 左侧：聊天窗口（消息流 + 输入框）
   - 右侧：攒钱目标卡片（目标名、进度条、已攒/目标、剩余、预计达成信息）
3. 用户输入想买的物品（示例：“我好想花 800 块买个盲盒”）
4. 系统解析消费意图，补全或确认价格（MVP 可由用户直接输入或从 mock 比价结果中选择）
5. 系统模拟检索同类商品底价（mock），并计算“消费影响”
   - 目标进度影响（本次购买相当于吃掉多少进度/增加多少缺口）
   - 目标达成时间影响（若可推算，显示延后天数）
6. Agent 选择人格并给出结论：劝退 / 鼓励 / 中立建议
   - 人格：赛博财神 / 毒舌闺蜜
   - 同时输出 1 段风格化建议（可执行、带替代方案或条件购买）
7. 若被劝退：生成并保存冷静清单（可勾选）
8. 用户可跳转到“冷静清单页”，查看所有被劝退的商品与对应清单

## 3. MVP 功能范围

必须包含（本需求）：

- 聊天输入（带上下文的对话）
- 攒钱目标设置（目标金额/期限或每月储蓄额；支持查看与编辑）
- 消费影响计算（对目标金额与达成时间的影响）
- 商品价格对比（mock 数据：多渠道报价、最低价、可节省金额）
- Agent 人格化建议（赛博财神 / 毒舌闺蜜：生成一段有风格的建议文本，并给出“劝退/鼓励”结论）
- 冷静清单（模板 + 可勾选 + 可保存本次清单；并可在“冷静清单页”汇总展示所有被劝退商品）

MVP 交互与页面建议：

- 页面 1：首页（项目主题 + 两个入口按钮）
  - 模块：项目介绍文案、按钮“开始劝退我”“设置攒钱目标”
  - 可选：展示最近一次“劝退/鼓励”结果摘要卡片
- 页面 2：聊天页（左聊天、右目标卡片）
  - 左侧：聊天输入与消息流（包含分析卡片：影响、底价对比、结论）
  - 右侧：攒钱目标卡片（Progress + 数字 + 目标名）
- 页面 3：攒钱目标页（目标详情 + 进度条）
  - 示例：日本旅行基金：4200 / 10000，进度：42%
  - 支持编辑：目标名、目标金额、已攒金额、（可选）目标日期/每月储蓄
- 页面 4：冷静清单页（展示所有被劝退的商品）
  - 列表：商品名、使用价格、底价、可省金额、劝退时间、人格、建议摘要
  - 详情：进入后可查看该商品的冷静清单勾选状态

## 4. 前后端技术栈

### 前端

- Next.js（建议 App Router）
- Tailwind CSS
- shadcn/ui（Dialog、Card、Tabs、Badge、Progress、Form、Toast）
- 数据请求：fetch + Server Actions 或 React Query（二选一，PoC 推荐 fetch + route handlers 直连后端）
- 状态：轻量 useState/useReducer；会话可存在 localStorage（MVP）并可同步后端

### 后端

- FastAPI（REST API）
- Pydantic v2
- ORM：SQLAlchemy 2.x 或 SQLModel（推荐 SQLModel 以减少样板代码）
- SQLite（单文件数据库，PoC 友好）

### LLM 接口（预留）

- 抽象为 Provider Adapter：
  - OpenAI（/v1/chat/completions 或 Responses）
  - Qwen（兼容 OpenAI 协议或独立 SDK）
  - DeepSeek（兼容 OpenAI 协议或独立 SDK）
- MVP 可默认使用“规则模板 + 可选 LLM”：
  - 没有配置 Key 时也能演示（确保可演示）

## 5. 系统架构

逻辑架构（PoC）：

- Next.js Web（UI）
  - 首页：主题展示 + 导航入口
  - 聊天页：左聊天窗口 + 右攒钱目标卡片
  - 攒钱目标页：进度条与目标编辑
  - 冷静清单页：所有被劝退商品的汇总列表与清单详情
- FastAPI（应用服务）
  - Agent Orchestrator：把“解析 → 计算 → 比价 → 生成建议 → 组装结果”串起来
  - Price Service：mock 价格检索与对比
  - Goal Service：目标 CRUD 与计算参数读取
  - Cooldown Service：保存/查询被劝退商品与冷静清单
  - LLM Gateway：统一封装 OpenAI/Qwen/DeepSeek 调用（可关闭）
- SQLite（持久化）

数据流（一次聊天回合）：

1. 前端发送用户输入（可带显式 price、goal_id、session_id）
2. 后端读取目标与会话上下文
3. 解析商品与价格（缺失则走 mock 或追问）
4. 计算消费影响（影响卡片）
5. 获取价格对比（mock）
6. 生成建议文本（LLM 或模板）
7. 返回结构化结果给前端渲染（文本 + 卡片数据 + 清单）

## 6. 数据库表设计

说明：为保证可演示，MVP 支持单用户模式（user_id 可固定为 1），也保留扩展到多用户的字段。

### users

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | integer | PK | 用户 ID |
| display_name | text | not null | 展示名 |
| created_at | datetime | not null | 创建时间 |

### saving_goals

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | integer | PK | 目标 ID |
| user_id | integer | FK(users.id) | 用户 |
| name | text | not null | 目标名（如“相机基金”） |
| target_amount | integer | not null | 目标金额（分/厘/元：建议统一“分”） |
| current_amount | integer | not null default 0 | 当前已攒金额 |
| start_date | date | not null | 开始日期 |
| target_date | date | nullable | 目标日期（可选：按期限） |
| monthly_contribution | integer | nullable | 每月固定储蓄（可选） |
| created_at | datetime | not null | 创建时间 |
| updated_at | datetime | not null | 更新时间 |

约定：MVP 至少支持一种输入方式：

- A：目标金额 + 目标日期（系统反推每日需要攒多少）
- B：目标金额 + 每月储蓄额（系统推算预计达成日期）

### chat_sessions

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | text | PK | 会话 ID（UUID） |
| user_id | integer | FK(users.id) | 用户 |
| goal_id | integer | FK(saving_goals.id) | 当前会话绑定的目标 |
| created_at | datetime | not null | 创建时间 |

### chat_messages

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | integer | PK | 消息 ID |
| session_id | text | FK(chat_sessions.id) | 会话 |
| role | text | not null | user/assistant/system |
| content | text | not null | 文本内容 |
| created_at | datetime | not null | 创建时间 |

### purchase_intents

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | integer | PK | 记录 ID |
| user_id | integer | FK(users.id) | 用户 |
| goal_id | integer | FK(saving_goals.id) | 对应目标 |
| session_id | text | FK(chat_sessions.id) | 会话 |
| item_name | text | not null | 商品名 |
| stated_price | integer | nullable | 用户输入价格（分） |
| chosen_price | integer | not null | 本次计算使用价格（分） |
| currency | text | not null default 'CNY' | 币种 |
| reason | text | nullable | 想买原因 |
| decision | text | not null | 结论：discourage/encourage/neutral |
| persona | text | not null | 人格：cyber_caishen/toxic_bestie |
| advice_text | text | not null | 最终建议文本（用于冷静清单页摘要展示） |
| best_price | integer | nullable | 模拟检索到的同类底价（分） |
| save_vs_best | integer | nullable | 与底价相比可省金额（分） |
| eta_shift_days | integer | nullable | 若购买导致目标延后天数（可推算则写） |
| created_at | datetime | not null | 创建时间 |

### price_quotes

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | integer | PK | 报价 ID |
| purchase_intent_id | integer | FK(purchase_intents.id) | 对应意图 |
| source | text | not null | 渠道（Mock: 京东/天猫/拼多多/线下等） |
| price | integer | not null | 价格（分） |
| url | text | nullable | 链接（mock 可空） |
| created_at | datetime | not null | 创建时间 |

### cooldown_lists

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | integer | PK | 清单 ID |
| purchase_intent_id | integer | FK(purchase_intents.id) | 对应意图 |
| items_json | text | not null | 清单项 JSON（[{text, checked}]） |
| created_at | datetime | not null | 创建时间 |

## 7. API 设计

约定：

- Base URL：`/api`
- 货币单位：后端统一用“分”（integer）；前端展示时格式化为元
- 所有响应包含 `request_id`（便于演示排查）

### Goals

#### POST /api/goals

创建目标

请求：

```json
{
  "name": "相机基金",
  "target_amount": 600000,
  "current_amount": 100000,
  "start_date": "2026-04-29",
  "target_date": "2026-06-28",
  "monthly_contribution": null
}
```

### Cooldown（冷静清单汇总）

#### GET /api/cooldown/items

返回所有被劝退的商品（用于冷静清单页）

响应：

```json
{
  "request_id": "req_...",
  "items": [
    {
      "purchase_intent_id": 12,
      "item_name": "盲盒",
      "chosen_price": 80000,
      "best_price": 59000,
      "save_vs_best": 21000,
      "persona": "toxic_bestie",
      "advice_text": "……",
      "created_at": "2026-04-29T10:00:00Z"
    }
  ]
}
```

#### GET /api/cooldown/items/{purchase_intent_id}

返回某个被劝退商品的冷静清单详情（用于详情页/弹窗）

## 8. Agent 工作流

响应（节选）：

```json
{
  "id": 1,
  "name": "相机基金",
  "target_amount": 600000,
  "current_amount": 100000
}
```

#### GET /api/goals/current

获取当前目标（MVP 可返回用户最近使用的目标）

#### PATCH /api/goals/{goal_id}

编辑目标

### Chat / Agent

#### POST /api/chat

一次对话回合：输入 → 分析 → 建议 → 冷静清单

请求：

```json
{
  "session_id": "2a5c1e61-3b9e-4b50-9b8f-4f0f3d2d9b0a",
  "goal_id": 1,
  "message": "想买 AirPods，1299 元",
  "explicit_price": 129900,
  "currency": "CNY",
  "llm_provider": "openai",
  "llm_enabled": false
}
```

响应（结构化，便于前端卡片化渲染）：

```json
{
  "request_id": "req_...",
  "session_id": "2a5c1e61-3b9e-4b50-9b8f-4f0f3d2d9b0a",
  "assistant_message": "……（人格化建议文本）",
  "parsed": {
    "item_name": "AirPods",
    "price": 129900,
    "reason": null
  },
  "decision": {
    "result": "discourage",
    "persona": "cyber_caishen"
  },
  "impact": {
    "goal_name": "相机基金",
    "price": 129900,
    "current_amount_before": 100000,
    "current_amount_after_if_buy": 0,
    "remaining_before": 500000,
    "remaining_after_if_buy": 629900,
    "daily_plan": 8333,
    "eta_shift_days": 16
  },
  "price_comparison": {
    "quotes": [
      { "source": "京东", "price": 129900, "url": null },
      { "source": "天猫", "price": 124900, "url": null },
      { "source": "拼多多", "price": 119900, "url": null }
    ],
    "best": { "source": "拼多多", "price": 119900 },
    "save_vs_current": 10000
  },
  "cooldown": {
    "items": [
      { "text": "先放入冷静清单 24 小时", "checked": false },
      { "text": "写下：我买它是为了解决什么问题？", "checked": false },
      { "text": "找一个 0 元替代方案先用 1 天", "checked": false },
      { "text": "如果仍想买：只买最低价渠道并设置价格提醒", "checked": false }
    ]
  }
}
```

#### POST /api/sessions

创建会话（返回 session_id），可绑定默认 goal_id

#### GET /api/sessions/{session_id}/messages

获取历史消息（演示可用）

### Prices（Mock）

#### GET /api/prices/search?query=xxx

返回 mock 价格列表（可用于前端“选择价格”或“展示对比”）

响应：

```json
{
  "query": "AirPods",
  "currency": "CNY",
  "quotes": [
    { "source": "京东", "price": 129900, "url": null },
    { "source": "天猫", "price": 124900, "url": null }
  ]
}
```

### LLM（可选）

#### GET /api/llm/providers

返回可用 provider 列表与启用状态（用于演示“可切换”）

```json
{
  "providers": [
    { "name": "openai", "enabled": false },
    { "name": "qwen", "enabled": false },
    { "name": "deepseek", "enabled": false }
  ]
}
```

## 8. Agent 工作流

MVP 采用“确定性计算 + 可选生成式表达”的组合，确保没有 Key 也能稳定演示。

### 输入

- 用户自然语言（必填）
- 目标信息（goal_id 或默认目标）
- 可选：显式价格 explicit_price（用户输入或 UI 选择）

### 人格与决策

人格（MVP 两种）：

- 赛博财神（cyber_caishen）：赛博、幽默、带一点“神谕感”，重点强调目标进度与机会成本
- 毒舌闺蜜（toxic_bestie）：直接、犀利但不羞辱，重点拆穿冲动理由并给出替代方案

劝退/鼓励（决策）策略（MVP：规则优先，LLM 只负责表达）：

- 劝退（discourage）
  - 购买会让目标延后天数 ≥ 阈值（如 7 天）；或
  - 购买金额占目标剩余缺口比例 ≥ 阈值（如 10%）；或
  - 与同类底价差额较大（如 save_vs_best ≥ 5% 且金额可观），建议先等/换渠道
- 鼓励（encourage）
  - 金额很小且对目标影响可忽略；或
  - 用户明确表达“这是刚需/能提升效率”，且有条件购买（只买底价/二手/等折扣）
- 中立（neutral）
  - 信息不足（价格缺失/目标缺失），先追问补齐

### 步骤（一次 /api/chat）

1. 语义解析（轻量）
   - 提取 item_name、价格、原因（可用正则 + 简单规则；LLM 可选增强）
2. 价格确定
   - 若用户提供价格：优先使用
   - 若未提供：调用 mock 比价得到候选，选择最低价或返回追问
3. 影响计算（确定性）
   - remaining_before = target_amount - current_amount
   - remaining_after_if_buy = target_amount - max(current_amount - price, 0)
     - 等价表达：购买会让“已攒”减少（心理账户视角），或让“缺口”增加
   - daily_plan（根据目标日期或 monthly_contribution 推导）
   - eta_shift_days = ceil((remaining_after_if_buy - remaining_before) / daily_plan)
4. 价格对比
   - 返回 quotes、best、save_vs_current
5. 决策：劝退 / 鼓励 / 中立
   - 基于 eta_shift_days、占用目标缺口比例、与底价价差等规则得出 result
6. 建议生成（人格化表达）
   - 输入：persona、result、item_name、price、eta_shift_days、best price、节省金额、目标信息
   - 输出：1 段风格化建议文本（短、可执行、给替代方案或条件购买）
   - LLM 不可用时：使用模板生成（确保可演示）
7. 冷静清单生成（仅当 result=discourage）
   - 基础模板 + 根据金额/延后天数/品类增强
   - 保存 purchase_intent 与 cooldown_list（用于冷静清单页汇总）
8. 结构化响应返回前端

### 人格设定（建议基调）

- 口吻：有风格但尊重用户；不羞辱；强调“你在掌控钱，而不是钱在掌控你”
- 输出结构：结论一句话（劝退/鼓励） + 影响一句话（目标进度/延后） + 动作建议 2-3 条

## 9. 可演示场景

场景 A：冲动买耳机（强演示）

- 目标：60 天游 6000 元
- 输入：“想买 AirPods，1299 元”
- 展示：
  - 影响卡片：目标延后 X 天、缺口增加、每日需要多攒多少
  - 价格对比：多渠道 mock，提示“最低价可省 100 元”
  - 建议：赛博财神爷风格输出
  - 冷静清单：勾选“24 小时冷静/写下购买理由/找替代方案”

场景 B：小额高频（咖啡/奶茶）

- 输入：“想点 38 元奶茶”
- 展示：
  - 影响：对大目标的累计影响（可用“每周 3 次 = 月度 X 元”作为扩展提示）
  - 建议：用“可替代方案”（白水/自带咖啡/买豆子）

场景 C：预算拉扯（升级显卡/手机）

- 输入：“想换手机 4999，旧的还能用”
- 展示：
  - 影响大、延后明显
  - 价格对比：提示“等 618/双11 可能更低”（mock 文案）
  - 冷静清单：加入“写下旧设备痛点/列 3 个必须满足的需求”

场景 D：盲盒冲动（人格对比演示）

- 输入：“我好想花 800 块买个盲盒”
- 展示：
  - mock 底价：同类/同系列最低价（如 590 元）
  - 影响卡片：对“日本旅行基金”进度的侵蚀（例如从 42% 掉到 34%）
  - 人格切换：赛博财神 vs 毒舌闺蜜输出不同风格的同一结论
  - 冷静清单页：自动新增一条“被劝退商品”

## 10. 后续扩展方向

- 真实比价与商品识别：接入电商搜索、条码/链接解析、价格趋势与降价提醒
- 预算与账本：收入/支出分类、固定支出、可支配预算、月度复盘
- 目标体系：多目标、优先级、自动分配、里程碑与成就系统
- 行为干预：24 小时冷静期、强制二次确认、情绪触发识别（压力/熬夜/报复性消费）
- 个性化 Agent：长期记忆（用户偏好/雷区）、更细的人格风格切换
- 多端与触达：微信小程序/浏览器插件/移动端推送
- 安全与隐私：本地优先、端侧加密、敏感字段脱敏与最小化存储
- 可观测性：A/B 文案实验、转化漏斗、效果评估（“劝退率”“节省金额”）

## 11. 设计任务拆分（按实现顺序）

目标：先做出“可演示闭环”，再逐步增强能力与体验。

### 任务一：项目脚手架与基础联通

- 子任务 1：初始化前端（Next.js + Tailwind + shadcn/ui），建立全局布局与导航（4 个页面入口）
- 子任务 2：初始化后端（FastAPI），提供健康检查与 CORS
- 子任务 3：SQLite 初始化与迁移策略（PoC 可用启动时建表，或引入轻量迁移）
- 子任务 4：约定统一金额单位（后端分、前端格式化为元）

### 任务二：攒钱目标（Goal）能力

- 子任务 1：实现 saving_goals 表与 CRUD API（创建/读取当前/编辑）
- 子任务 2：攒钱目标页 UI：进度条展示（例：日本旅行基金 4200/10000，42%）
- 子任务 3：聊天页右侧目标卡片：实时读取并展示当前目标

### 任务三：首页与页面路由（演示入口）

- 子任务 1：首页 UI：主题文案 + “开始劝退我”“设置攒钱目标”按钮
- 子任务 2：从首页进入聊天页时自动创建/恢复 session
- 子任务 3：基础 UI 统一（按钮、卡片、进度条、Toast）

### 任务四：Agent 核心闭环（输入 → 底价 → 影响 → 结论 → 建议）

- 子任务 1：mock 比价服务与接口（/api/prices/search）
- 子任务 2：消费意图解析（item_name/price/reason 的规则解析）
- 子任务 3：影响计算（目标进度、缺口、可选延后天数）
- 子任务 4：决策策略（discourage/encourage/neutral）
- 子任务 5：人格化建议生成（模板优先，LLM 可选增强）
- 子任务 6：聊天页左侧 UI：消息流 + 分析卡片渲染（影响、底价、结论）

### 任务五：冷静清单与“被劝退商品”汇总页

- 子任务 1：保存 purchase_intents（包含 decision/persona/advice_text/底价信息）
- 子任务 2：仅对 discourage 生成并保存 cooldown_lists
- 子任务 3：冷静清单页 UI：展示所有被劝退商品列表（可进入详情查看清单）
- 子任务 4：冷静清单勾选状态更新（最小实现：本地更新；进阶：回写后端）

### 任务六：LLM Provider 预留与可切换演示

- 子任务 1：LLM Gateway 抽象（openai/qwen/deepseek）
- 子任务 2：无 Key 时自动降级到模板生成，确保演示稳定
- 子任务 3：前端提供人格选择与（可选）provider 展示

### 任务七：演示强化与体验打磨

- 子任务 1：提供内置演示数据（默认目标、示例输入快捷按钮）
- 子任务 2：关键路径动效与反馈（加载态、错误态、复制分享建议）
- 子任务 3：历史记录与复盘（可选：最近 N 条“劝退/鼓励”记录）

"use client"

import * as React from "react"

import { PageShell } from "@/components/page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"

type SavingGoal = {
  id: number
  name: string
  target_amount: number
  current_amount: number
}

type CreateSessionResponse = {
  session_id: string
  goal_id: number | null
}

type ChatResponse = {
  request_id: string
  session_id: string | null
  assistant_message: string
  parsed: { item_name: string; price: number | null; reason: string | null }
  decision: { result: "discourage" | "encourage" | "neutral"; persona: "cyber_caishen" | "toxic_bestie" }
  impact:
    | {
        goal_name: string
        price: number
        current_amount_before: number
        current_amount_after_if_buy: number
        remaining_before: number
        remaining_after_if_buy: number
        daily_plan: number | null
        eta_shift_days: number | null
      }
    | null
  price_comparison:
    | {
        quotes: Array<{ source: string; price: number; url: string | null }>
        best: { source: string; price: number }
        save_vs_current: number
      }
    | null
  purchase_intent_id: number | null
  cooldown: { items: Array<{ text: string; checked: boolean }> }
}

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
}

function yuanFromCents(cents: number) {
  return (cents / 100).toFixed(2)
}

function personaLabel(persona: ChatResponse["decision"]["persona"]) {
  return persona === "cyber_caishen" ? "赛博财神" : "毒舌闺蜜"
}

function decisionLabel(result: ChatResponse["decision"]["result"]) {
  if (result === "discourage") return "劝退"
  if (result === "encourage") return "鼓励"
  return "中立"
}

function clampProgress(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function getStoredSessionId() {
  try {
    return localStorage.getItem("cyber_caishen_session_id")
  } catch {
    return null
  }
}

function setStoredSessionId(sessionId: string) {
  try {
    localStorage.setItem("cyber_caishen_session_id", sessionId)
  } catch {}
}

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  payload?: ChatResponse
}

export default function ChatPage() {
  const [sessionState, setSessionState] = React.useState<{
    status: "loading" | "ready" | "down"
    sessionId?: string
  }>({ status: "loading" })

  const [goalState, setGoalState] = React.useState<{ status: "loading" | "ready" | "down"; goal: SavingGoal | null }>({
    status: "loading",
    goal: null,
  })

  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "m0",
      role: "assistant",
      content: "我是赛博财神爷。把你想买的东西讲清楚（最好带价格），我来算算它对你攒钱目标的影响。",
    },
  ])
  const [draft, setDraft] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [persona, setPersona] = React.useState<"auto" | "cyber_caishen" | "toxic_bestie">("auto")
  const [llmEnabled, setLlmEnabled] = React.useState(false)
  const [llmProvider, setLlmProvider] = React.useState<"openai" | "qwen" | "deepseek">("openai")
  const [providerState, setProviderState] = React.useState<
    | { status: "loading" | "down"; enabledMap: Record<string, boolean> }
    | { status: "ready"; enabledMap: Record<string, boolean> }
  >({ status: "loading", enabledMap: {} })

  React.useEffect(() => {
    const baseUrl = getApiBaseUrl()
    const storedSessionId = getStoredSessionId()
    if (storedSessionId) {
      setSessionState({ status: "ready", sessionId: storedSessionId })
    } else {
      fetch(`${baseUrl}/api/sessions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((data: CreateSessionResponse) => {
          setStoredSessionId(data.session_id)
          setSessionState({ status: "ready", sessionId: data.session_id })
        })
        .catch(() => setSessionState({ status: "down" }))
    }

    fetch(`${baseUrl}/api/goals/current`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: SavingGoal | null) => setGoalState({ status: "ready", goal: data }))
      .catch(() => setGoalState({ status: "down", goal: null }))

    fetch(`${baseUrl}/api/llm/providers`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: { providers: Array<{ name: string; enabled: boolean }> }) => {
        const enabledMap: Record<string, boolean> = {}
        data.providers.forEach((p) => {
          enabledMap[p.name] = p.enabled
        })
        setProviderState({ status: "ready", enabledMap })
      })
      .catch(() => setProviderState({ status: "down", enabledMap: {} }))
  }, [])

  const progress = goalState.goal
    ? clampProgress(Math.round((goalState.goal.current_amount / Math.max(goalState.goal.target_amount, 1)) * 100))
    : 0

  const canSend = draft.trim().length > 0 && sessionState.status === "ready" && !sending

  async function sendMessage(text: string) {
    const baseUrl = getApiBaseUrl()
    const sessionId = sessionState.sessionId
    if (!sessionId) return

    const userMessage: Message = { id: `u_${Date.now()}`, role: "user", content: text }
    setMessages((prev) => [...prev, userMessage])
    setSending(true)

    try {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          goal_id: goalState.goal?.id ?? null,
          message: text,
          explicit_price: null,
          currency: "CNY",
          persona,
          llm_provider: llmProvider,
          llm_enabled: llmEnabled,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as ChatResponse
      const assistantMessage: Message = {
        id: `a_${Date.now()}`,
        role: "assistant",
        content: data.assistant_message,
        payload: data,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `a_${Date.now()}`, role: "assistant", content: "接口没连上或返回异常。先确认后端已启动，然后重试。" },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <PageShell title="开始劝退我" description="输入想买的东西（带价格），我会给出底价对比 + 目标影响 + 劝退/鼓励建议。">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="min-h-[520px]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>聊天窗口</CardTitle>
                <CardDescription>示例：我好想花 800 块买个盲盒</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">PoC</Badge>
                <Badge variant={sessionState.status === "ready" ? "default" : "outline"}>
                  {sessionState.status === "loading"
                    ? "会话创建中"
                    : sessionState.status === "down"
                      ? "会话未连接"
                      : "会话已就绪"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex h-[420px] flex-col gap-3">
            <div className="flex-1 space-y-3 overflow-auto rounded-lg border bg-slate-50 p-4">
              {messages.map((m) => {
                const isUser = m.role === "user"
                return (
                  <div key={m.id} className={isUser ? "ml-auto max-w-[85%] space-y-2" : "max-w-[85%] space-y-2"}>
                    <div
                      className={
                        isUser
                          ? "rounded-xl bg-slate-900 p-3 text-sm text-white shadow-sm"
                          : "rounded-xl bg-white p-3 text-sm shadow-sm"
                      }
                    >
                      {m.content}
                    </div>

                    {m.payload ? (
                      <div className="grid gap-2">
                        <Card className="border-slate-200">
                          <CardHeader className="p-4">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-medium">结论</div>
                              <div className="flex items-center gap-2">
                                <Badge variant={m.payload.decision.result === "discourage" ? "secondary" : "default"}>
                                  {decisionLabel(m.payload.decision.result)}
                                </Badge>
                                <Badge variant="outline">{personaLabel(m.payload.decision.persona)}</Badge>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>

                        {m.payload.impact ? (
                          <Card className="border-slate-200">
                            <CardHeader className="p-4">
                              <CardTitle className="text-sm">目标影响</CardTitle>
                              <CardDescription className="text-xs">
                                {m.payload.impact.goal_name} · 本次 {yuanFromCents(m.payload.impact.price)} 元
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 p-4 pt-0 text-sm">
                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                <div>缺口（购买前）：{yuanFromCents(m.payload.impact.remaining_before)} 元</div>
                                <div>缺口（购买后）：{yuanFromCents(m.payload.impact.remaining_after_if_buy)} 元</div>
                                {m.payload.impact.eta_shift_days != null ? (
                                  <div className="col-span-2">预计延后：{m.payload.impact.eta_shift_days} 天</div>
                                ) : null}
                              </div>
                            </CardContent>
                          </Card>
                        ) : null}

                        {m.payload.price_comparison ? (
                          <Card className="border-slate-200">
                            <CardHeader className="p-4">
                              <CardTitle className="text-sm">模拟底价对比</CardTitle>
                              <CardDescription className="text-xs">
                                最低价：{m.payload.price_comparison.best.source} ·{" "}
                                {yuanFromCents(m.payload.price_comparison.best.price)} 元
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 p-4 pt-0 text-sm">
                              <div className="grid gap-1 text-xs text-slate-600">
                                {m.payload.price_comparison.quotes.map((q) => (
                                  <div key={q.source} className="flex items-center justify-between">
                                    <span>{q.source}</span>
                                    <span>{yuanFromCents(q.price)} 元</span>
                                  </div>
                                ))}
                              </div>
                              <div className="text-xs text-slate-600">
                                以最低价买：可省 {yuanFromCents(m.payload.price_comparison.save_vs_current)} 元
                              </div>
                            </CardContent>
                          </Card>
                        ) : null}

                        {m.payload.cooldown.items.length ? (
                          <Card className="border-slate-200">
                            <CardHeader className="p-4">
                              <CardTitle className="text-sm">冷静清单（预览）</CardTitle>
                              <CardDescription className="text-xs">Task 5 会把勾选与保存完整打通</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-1 p-4 pt-0 text-sm">
                              {m.payload.cooldown.items.map((it) => (
                                <div key={it.text} className="text-xs text-slate-700">
                                  - {it.text}
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>

            <div className="grid gap-2">
              <div className="grid gap-2 rounded-lg border bg-white p-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <label className="grid gap-1 text-xs text-slate-600">
                    人格
                    <select
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={persona}
                      onChange={(e) => setPersona(e.target.value as typeof persona)}
                    >
                      <option value="auto">自动</option>
                      <option value="cyber_caishen">赛博财神</option>
                      <option value="toxic_bestie">毒舌闺蜜</option>
                    </select>
                  </label>

                  <label className="grid gap-1 text-xs text-slate-600">
                    LLM Provider
                    <select
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={llmProvider}
                      onChange={(e) => setLlmProvider(e.target.value as typeof llmProvider)}
                    >
                      <option value="openai">openai</option>
                      <option value="qwen">qwen</option>
                      <option value="deepseek">deepseek</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={llmEnabled}
                      onChange={(e) => setLlmEnabled(e.target.checked)}
                    />
                    启用 LLM（可选增强）
                  </label>
                </div>
                {llmEnabled ? (
                  <div className="text-xs text-slate-500">
                    {providerState.status === "ready" && providerState.enabledMap[llmProvider]
                      ? "当前 Provider 已配置 Key，将返回“增强模式”文案"
                      : "当前 Provider 未配置 Key，将自动降级为模板模式（不影响可演示）"}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setDraft("我好想花 800 块买个盲盒")}
                >
                  盲盒 800
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setDraft("想买 AirPods，1299 元")}
                >
                  AirPods 1299
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setDraft("")}>
                  清空
                </Button>
              </div>

              <Textarea
                placeholder="输入你想买的东西（最好带价格）…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {sending ? "生成建议中…" : "提示：没设置目标会返回“先去设置目标”"}
                </div>
                <Button
                  disabled={!canSend}
                  onClick={() => {
                    const text = draft.trim()
                    if (!text) return
                    setDraft("")
                    void sendMessage(text)
                  }}
                >
                  发送
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>攒钱目标</CardTitle>
            <CardDescription>右侧卡片固定展示，聊天随时参考</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {goalState.goal ? (
              <>
                <div className="space-y-1">
                  <div className="text-sm font-medium">{goalState.goal.name}</div>
                  <div className="text-sm text-slate-600">
                    {yuanFromCents(goalState.goal.current_amount)} / {yuanFromCents(goalState.goal.target_amount)}
                  </div>
                </div>
                <Progress value={progress} />
                <div className="text-sm text-slate-600">进度：{progress}%</div>
              </>
            ) : (
              <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">
                {goalState.status === "down" ? "目标服务未连接。" : "还没有目标。先去创建一个。"}
              </div>
            )}
            <Button variant="outline" className="w-full" asChild>
              <a href="/goals">去设置 / 编辑目标</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

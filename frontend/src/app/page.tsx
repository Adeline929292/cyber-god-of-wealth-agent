"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { BackendStatus } from "@/components/backend-status"
import { PageShell } from "@/components/page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type CooldownListItem = {
  purchase_intent_id: number
  item_name: string
  chosen_price: number
  persona: string
  advice_text: string
  created_at: string
}

type SavingGoal = {
  id: number
}

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
}

function yuanFromCents(cents: number) {
  return (cents / 100).toFixed(2)
}

function personaLabel(persona: string) {
  return persona === "cyber_caishen" ? "赛博财神" : "毒舌闺蜜"
}

export default function HomePage() {
  const router = useRouter()
  const [recent, setRecent] = React.useState<CooldownListItem[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const baseUrl = getApiBaseUrl()
    fetch(`${baseUrl}/api/cooldown/items`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: { items: CooldownListItem[] }) => setRecent(data.items.slice(0, 3)))
      .catch(() => setRecent([]))
  }, [])

  async function ensureDemoGoal(): Promise<SavingGoal> {
    const baseUrl = getApiBaseUrl()
    const cur = await fetch(`${baseUrl}/api/goals/current`, { cache: "no-store" })
    if (!cur.ok) throw new Error(`HTTP ${cur.status}`)
    const existing = (await cur.json()) as SavingGoal | null
    if (existing) return existing

    const today = new Date().toISOString().slice(0, 10)
    const payload = {
      name: "日本旅行基金",
      target_amount: 1000000,
      current_amount: 420000,
      start_date: today,
      target_date: null,
      monthly_contribution: 200000,
    }
    const res = await fetch(`${baseUrl}/api/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as SavingGoal
  }

  async function startDemo(preset: "blindbox" | "airpods") {
    setLoading(true)
    try {
      await ensureDemoGoal()
      router.push(`/chat?preset=${preset}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell
      title="赛博财神爷"
      description="反冲动消费与攒钱的理财陪伴 Agent（PoC）。输入你想买的东西，让“赛博财神”或“毒舌闺蜜”来劝退或鼓励你。"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="lg">
          <Link href="/chat">开始劝退我</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/goals">设置攒钱目标</Link>
        </Button>
        <Button size="lg" variant="secondary" disabled={loading} onClick={() => void startDemo("blindbox")}>
          {loading ? "准备演示中…" : "一键演示"}
        </Button>
        <div className="ml-auto">
          <BackendStatus />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>你把冲动说出来，我把账算清楚</CardTitle>
            <CardDescription>目标进度、模拟底价、机会成本，一次性讲明白。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="text-sm font-medium">示例输入</div>
              <div className="mt-2 text-sm text-slate-600">我好想花 800 块买个盲盒</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void startDemo("blindbox")} disabled={loading}>
                直接演示：盲盒 800
              </Button>
              <Button variant="secondary" onClick={() => void startDemo("airpods")} disabled={loading}>
                直接演示：AirPods 1299
              </Button>
              <Button asChild variant="ghost">
                <Link href="/cooldown">查看冷静清单</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近劝退</CardTitle>
            <CardDescription>展示最近 3 条被劝退记录</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {recent.length ? (
              <div className="grid gap-2">
                {recent.map((it) => (
                  <div key={it.purchase_intent_id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-slate-900">{it.item_name}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{personaLabel(it.persona)}</Badge>
                        <Badge variant="secondary">{yuanFromCents(it.chosen_price)} 元</Badge>
                      </div>
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-600">{it.advice_text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">暂无。先去聊天触发一次“劝退”。</div>
            )}
            <Button asChild variant="outline">
              <Link href="/cooldown">查看全部</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

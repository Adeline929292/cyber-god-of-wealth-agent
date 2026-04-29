"use client"

import * as React from "react"

import { PageShell } from "@/components/page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type CooldownListItem = {
  purchase_intent_id: number
  item_name: string
  chosen_price: number
  best_price: number | null
  save_vs_best: number | null
  persona: string
  advice_text: string
  created_at: string
}

type CooldownDetail = CooldownListItem & {
  items: Array<{ text: string; checked: boolean }>
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

export default function CooldownPage() {
  const [items, setItems] = React.useState<CooldownListItem[]>([])
  const [selectedId, setSelectedId] = React.useState<number | null>(null)
  const [detail, setDetail] = React.useState<CooldownDetail | null>(null)
  const [status, setStatus] = React.useState<"loading" | "ready" | "down">("loading")
  const [saving, setSaving] = React.useState(false)

  async function loadList() {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/cooldown/items`, { cache: "no-store" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as { items: CooldownListItem[] }
    setItems(data.items)
    return data.items
  }

  async function loadDetail(purchaseIntentId: number) {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/cooldown/items/${purchaseIntentId}`, { cache: "no-store" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as CooldownDetail
    setDetail(data)
  }

  React.useEffect(() => {
    setStatus("loading")
    loadList()
      .then((list) => {
        if (list.length) {
          setSelectedId(list[0].purchase_intent_id)
        }
        setStatus("ready")
      })
      .catch(() => setStatus("down"))
  }, [])

  React.useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    loadDetail(selectedId).catch(() => setDetail(null))
  }, [selectedId])

  async function persistChecklist(nextItems: CooldownDetail["items"]) {
    if (!detail) return
    setSaving(true)
    const baseUrl = getApiBaseUrl()
    try {
      const res = await fetch(`${baseUrl}/api/cooldown/items/${detail.purchase_intent_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: nextItems }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as CooldownDetail
      setDetail(data)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell title="冷静清单" description="展示所有被劝退的商品；可查看并勾选每条冷静清单。">
      {status === "down" ? (
        <Card>
          <CardHeader>
            <CardTitle>API 未连接</CardTitle>
            <CardDescription>请先启动后端（FastAPI），再刷新页面</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/chat">去聊天页</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader>
              <CardTitle>被劝退商品</CardTitle>
              <CardDescription>从聊天页触发“劝退”后会自动写入这里</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">
                  暂无记录。先去聊天页输入一个想买的东西（带价格），触发一次“劝退”。
                </div>
              ) : (
                <div className="grid gap-2">
                  {items.map((it) => {
                    const active = it.purchase_intent_id === selectedId
                    return (
                      <button
                        key={it.purchase_intent_id}
                        onClick={() => setSelectedId(it.purchase_intent_id)}
                        className={
                          "w-full rounded-lg border p-3 text-left transition-colors " +
                          (active ? "border-slate-900 bg-slate-50" : "hover:bg-slate-50")
                        }
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium">{it.item_name}</div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{personaLabel(it.persona)}</Badge>
                            <Badge variant="secondary">{yuanFromCents(it.chosen_price)} 元</Badge>
                          </div>
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs text-slate-600">{it.advice_text}</div>
                      </button>
                    )
                  })}
                </div>
              )}
              <Button asChild>
                <a href="/chat">去聊天页</a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>清单详情</CardTitle>
              <CardDescription>{detail ? `编号 #${detail.purchase_intent_id}` : "选择左侧任意一条查看"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {detail ? (
                <>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{detail.item_name}</div>
                    <div className="text-xs text-slate-600">
                      购买价：{yuanFromCents(detail.chosen_price)} 元
                      {detail.best_price != null ? ` · 底价：${yuanFromCents(detail.best_price)} 元` : null}
                      {detail.save_vs_best != null ? ` · 可省：${yuanFromCents(detail.save_vs_best)} 元` : null}
                    </div>
                  </div>

                  <div className="rounded-lg border bg-slate-50 p-3 text-xs text-slate-700">{detail.advice_text}</div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">冷静清单</div>
                      <div className="text-xs text-slate-500">{saving ? "保存中…" : " "}</div>
                    </div>

                    <div className="grid gap-2">
                      {detail.items.map((it, idx) => (
                        <label key={it.text} className="flex cursor-pointer items-start gap-2 rounded-md border p-3">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4"
                            checked={it.checked}
                            onChange={(e) => {
                              const next = detail.items.map((x, i) => (i === idx ? { ...x, checked: e.target.checked } : x))
                              setDetail((prev) => (prev ? { ...prev, items: next } : prev))
                              void persistChecklist(next)
                            }}
                          />
                          <span className="text-sm">{it.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">暂无详情</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  )
}

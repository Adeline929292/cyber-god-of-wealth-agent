"use client"

import * as React from "react"

import { PageShell } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

type SavingGoal = {
  id: number
  user_id: number | null
  name: string
  target_amount: number
  current_amount: number
  start_date: string
  target_date: string | null
  monthly_contribution: number | null
  created_at: string
  updated_at: string
}

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
}

function centsFromYuan(input: string) {
  const n = Number.parseFloat(input)
  if (Number.isNaN(n)) return 0
  return Math.round(n * 100)
}

function yuanFromCents(cents: number) {
  return (cents / 100).toFixed(2)
}

function clampProgress(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

export default function GoalsPage() {
  const [status, setStatus] = React.useState<"loading" | "ready" | "saving" | "error">("loading")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [goal, setGoal] = React.useState<SavingGoal | null>(null)

  const [form, setForm] = React.useState({
    name: "",
    targetYuan: "",
    currentYuan: "",
    startDate: new Date().toISOString().slice(0, 10),
    targetDate: "",
    monthlyYuan: "",
  })

  const loadCurrentGoal = React.useCallback(async () => {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/goals/current`, { cache: "no-store" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as SavingGoal | null
    setGoal(data)
    if (data) {
      setForm({
        name: data.name,
        targetYuan: yuanFromCents(data.target_amount),
        currentYuan: yuanFromCents(data.current_amount),
        startDate: data.start_date,
        targetDate: data.target_date ?? "",
        monthlyYuan: data.monthly_contribution == null ? "" : yuanFromCents(data.monthly_contribution),
      })
    } else {
      setForm((prev) => ({
        ...prev,
        name: "日本旅行基金",
        targetYuan: "10000.00",
        currentYuan: "4200.00",
      }))
    }
  }, [])

  React.useEffect(() => {
    setStatus("loading")
    loadCurrentGoal()
      .then(() => {
        setErrorMessage(null)
        setStatus("ready")
      })
      .catch((e: unknown) => {
        setErrorMessage(e instanceof Error ? e.message : "加载失败")
        setStatus("error")
      })
  }, [loadCurrentGoal])

  const targetCents = centsFromYuan(form.targetYuan)
  const currentCents = centsFromYuan(form.currentYuan)
  const progress = clampProgress(Math.round((currentCents / Math.max(targetCents, 1)) * 100))

  const canSave =
    form.name.trim().length > 0 &&
    targetCents >= 1 &&
    currentCents >= 0 &&
    form.startDate.trim().length > 0 &&
    status !== "saving"

  async function onSave() {
    if (!canSave) return
    setStatus("saving")
    setErrorMessage(null)

    const baseUrl = getApiBaseUrl()
    const payload = {
      name: form.name.trim(),
      target_amount: targetCents,
      current_amount: currentCents,
      start_date: form.startDate,
      target_date: form.targetDate.trim().length ? form.targetDate : null,
      monthly_contribution: form.monthlyYuan.trim().length ? centsFromYuan(form.monthlyYuan) : null,
    }

    try {
      const res = await fetch(goal ? `${baseUrl}/api/goals/${goal.id}` : `${baseUrl}/api/goals`, {
        method: goal ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await loadCurrentGoal()
      setStatus("ready")
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "保存失败")
      setStatus("error")
    }
  }

  return (
    <PageShell title="攒钱目标" description="创建 / 编辑攒钱目标；聊天页右侧会实时展示“当前目标”。">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>目标进度</CardTitle>
            <CardDescription>示例：日本旅行基金：4200 / 10000，进度：42%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {goal ? (
              <>
                <div className="space-y-1">
                  <div className="text-sm font-medium">{goal.name}</div>
                  <div className="text-sm text-slate-600">
                    {yuanFromCents(goal.current_amount)} / {yuanFromCents(goal.target_amount)}
                  </div>
                </div>
                <Progress value={progress} />
                <div className="text-sm text-slate-600">进度：{progress}%</div>
              </>
            ) : (
              <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">
                还没有目标。先在右侧创建一个，聊天页才能做“影响计算”。
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>设置目标</CardTitle>
            <CardDescription>{goal ? "已存在目标：保存会更新当前目标" : "创建你的第一个目标"}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">目标名称</Label>
              <Input
                id="name"
                placeholder="例如：日本旅行基金"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="target">目标金额（元）</Label>
              <Input
                id="target"
                placeholder="10000.00"
                value={form.targetYuan}
                onChange={(e) => setForm((p) => ({ ...p, targetYuan: e.target.value }))}
                inputMode="decimal"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="current">当前已攒（元）</Label>
              <Input
                id="current"
                placeholder="4200.00"
                value={form.currentYuan}
                onChange={(e) => setForm((p) => ({ ...p, currentYuan: e.target.value }))}
                inputMode="decimal"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="startDate">开始日期</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="targetDate">目标日期（可选）</Label>
              <Input
                id="targetDate"
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="monthly">每月储蓄（可选，元）</Label>
              <Input
                id="monthly"
                placeholder="2000.00"
                value={form.monthlyYuan}
                onChange={(e) => setForm((p) => ({ ...p, monthlyYuan: e.target.value }))}
                inputMode="decimal"
              />
            </div>

            {errorMessage ? <div className="text-sm text-red-600">操作失败：{errorMessage}</div> : null}

            <Button onClick={onSave} disabled={!canSave}>
              {status === "saving" ? "保存中…" : goal ? "保存（更新）" : "保存（创建）"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}


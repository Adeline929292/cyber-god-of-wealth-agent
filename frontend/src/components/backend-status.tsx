"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"

type HealthResponse = {
  ok: boolean
  app: string
  env: string
}

export function BackendStatus() {
  const [state, setState] = React.useState<{
    status: "loading" | "ok" | "down"
    data?: HealthResponse
  }>({ status: "loading" })

  React.useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
    fetch(`${baseUrl}/api/health`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: HealthResponse) => setState({ status: "ok", data }))
      .catch(() => setState({ status: "down" }))
  }, [])

  if (state.status === "loading") return <Badge variant="secondary">API 检测中</Badge>
  if (state.status === "down") return <Badge variant="outline">API 未连接</Badge>

  return <Badge>API 已连接</Badge>
}

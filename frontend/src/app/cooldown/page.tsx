import { PageShell } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CooldownPage() {
  return (
    <PageShell title="冷静清单" description="这里会展示所有被劝退的商品（Task 5 接入后端）。">
      <Card>
        <CardHeader>
          <CardTitle>被劝退商品</CardTitle>
          <CardDescription>当 Agent 判定为 discourage 时，会自动写入这里</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">
            暂无记录。先去聊天页输入一个想买的东西。
          </div>
          <Button asChild>
            <a href="/chat">去聊天页</a>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  )
}


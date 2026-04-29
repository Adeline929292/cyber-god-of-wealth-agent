import Link from "next/link"

import { BackendStatus } from "@/components/backend-status"
import { PageShell } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
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
              <Button asChild variant="secondary">
                <Link href="/chat">立即开始</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/cooldown">查看冷静清单</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>演示路径</CardTitle>
            <CardDescription>四页闭环，方便现场展示</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <div>1. 首页：主题 + 两个入口</div>
            <div>2. 聊天页：左聊右目标</div>
            <div>3. 目标页：进度条</div>
            <div>4. 冷静清单：被劝退商品</div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

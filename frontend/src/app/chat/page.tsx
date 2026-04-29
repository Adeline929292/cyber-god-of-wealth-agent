import { PageShell } from "@/components/page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"

export default function ChatPage() {
  return (
    <PageShell title="开始劝退我" description="左侧聊天，右侧目标卡片。Task 1 先把脚手架跑通。">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="min-h-[520px]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>聊天窗口</CardTitle>
                <CardDescription>示例：我好想花 800 块买个盲盒</CardDescription>
              </div>
              <Badge variant="secondary">PoC</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex h-[420px] flex-col gap-3">
            <div className="flex-1 space-y-3 overflow-auto rounded-lg border bg-slate-50 p-4">
              <div className="max-w-[85%] rounded-xl bg-white p-3 text-sm shadow-sm">
                我是赛博财神爷。把你想买的东西讲清楚，我来算算它对你攒钱目标的影响。
              </div>
              <div className="ml-auto max-w-[85%] rounded-xl bg-slate-900 p-3 text-sm text-white shadow-sm">
                我好想花 800 块买个盲盒
              </div>
              <div className="max-w-[85%] rounded-xl bg-white p-3 text-sm shadow-sm">
                先别急。Task 2 会接入 mock 底价检索与目标进度计算，然后我再决定是劝退你还是鼓励你。
              </div>
            </div>

            <div className="grid gap-2">
              <Textarea placeholder="输入你想买的东西…" />
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">人格：赛博财神 / 毒舌闺蜜（Task 4 接入）</div>
                <Button disabled>发送</Button>
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
            <div className="space-y-1">
              <div className="text-sm font-medium">日本旅行基金</div>
              <div className="text-sm text-slate-600">4200 / 10000</div>
            </div>
            <Progress value={42} />
            <div className="text-sm text-slate-600">进度：42%</div>
            <Button variant="outline" className="w-full" asChild>
              <a href="/goals">去设置 / 编辑目标</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}


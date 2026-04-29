import { PageShell } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export default function GoalsPage() {
  const currentAmount = 4200
  const targetAmount = 10000
  const progress = Math.round((currentAmount / targetAmount) * 100)

  return (
    <PageShell title="攒钱目标" description="Task 2 会把这页接上后端 CRUD。Task 1 先保证页面好看可跑通。">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>目标进度</CardTitle>
            <CardDescription>示例：日本旅行基金：4200 / 10000，进度：42%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">日本旅行基金</div>
              <div className="text-sm text-slate-600">
                {currentAmount} / {targetAmount}
              </div>
            </div>
            <Progress value={progress} />
            <div className="text-sm text-slate-600">进度：{progress}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>设置目标</CardTitle>
            <CardDescription>先做静态表单占位，后续接入保存与计算</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">目标名称</Label>
              <Input id="name" placeholder="例如：日本旅行基金" defaultValue="日本旅行基金" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target">目标金额</Label>
              <Input id="target" placeholder="10000" defaultValue="10000" inputMode="numeric" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="current">当前已攒</Label>
              <Input id="current" placeholder="4200" defaultValue="4200" inputMode="numeric" />
            </div>
            <Button disabled>保存（Task 2）</Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}


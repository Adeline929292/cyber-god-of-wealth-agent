import Link from "next/link"

import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/", label: "首页" },
  { href: "/chat", label: "开始劝退我" },
  { href: "/goals", label: "攒钱目标" },
  { href: "/cooldown", label: "冷静清单" }
]

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
            ￥
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">赛博财神爷</div>
            <div className="text-xs text-slate-500">反冲动消费 · 攒钱陪伴</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/chat">开始劝退我</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

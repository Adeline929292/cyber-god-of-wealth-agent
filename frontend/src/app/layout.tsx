import type { Metadata } from "next"
import { Inter } from "next/font/google"

import "@/app/globals.css"
import { AppHeader } from "@/components/app-header"

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
})

export const metadata: Metadata = {
  title: "赛博财神爷",
  description: "反冲动消费与攒钱的理财陪伴 Agent PoC"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={inter.className}>
      <body>
        <div className="min-h-dvh bg-gradient-to-b from-slate-50 via-white to-slate-50">
          <AppHeader />
          <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6">{children}</main>
        </div>
      </body>
    </html>
  )
}

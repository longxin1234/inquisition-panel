"use client"

import Link from "next/link"
import { ArrowRight, ListTodo, ShieldCheck } from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"

/**
 * 保留旧地址，避免历史书签落到已废弃的“大杂烩”账号页。
 * 任务参数和通知分别由任务配置、安全设置维护。
 */
export default function UserAccountLegacyPage() {
  return (
    <DashboardLayout contentClassName="max-w-3xl">
      <main className="space-y-5">
        <header className="border-b border-border pb-5">
          <p className="text-xs font-semibold tracking-[0.14em] text-sky-700 dark:text-sky-300">账户入口已整理</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">账号设置已拆分</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">任务队列和运行参数统一放在任务配置，通知与游戏凭据统一放在安全设置。</p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/user/config" className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-sky-300 hover:bg-sky-50/60 dark:hover:border-sky-800 dark:hover:bg-sky-950/20">
            <ListTodo className="h-5 w-5 text-sky-600 dark:text-sky-300" aria-hidden="true" />
            <h2 className="mt-4 text-base font-semibold">任务配置</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">调整任务队列、体力、物资、基建和定时参数。</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-700 dark:text-sky-300">前往配置<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
          <Link href="/user/settings" className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-sky-300 hover:bg-sky-50/60 dark:hover:border-sky-800 dark:hover:bg-sky-950/20">
            <ShieldCheck className="h-5 w-5 text-sky-600 dark:text-sky-300" aria-hidden="true" />
            <h2 className="mt-4 text-base font-semibold">安全设置</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">更新游戏账号、授权和通知渠道。</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-700 dark:text-sky-300">前往设置<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        </div>

        <Button asChild variant="outline"><Link href="/user/dashboard">返回首页</Link></Button>
      </main>
    </DashboardLayout>
  )
}

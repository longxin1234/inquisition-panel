"use client"

import { useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  CheckCircle2,
  Copy,
  Check,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  Bell,
  MessageSquare,
  ShieldCheck,
  Sliders,
  ExternalLink,
  ChevronRight,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function UserGuidePage() {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const copyQGroup = () => {
    navigator.clipboard.writeText("866545280")
    setCopied(true)
    toast({ title: "复制成功", description: "官方交流 Q 群：866545280 已复制" })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DashboardLayout contentClassName="max-w-5xl">
      <main className="space-y-6">
        <header className="border-b border-border pb-5">
          <p className="text-xs font-semibold tracking-[0.14em] text-primary">USER GUIDE & DOCUMENTATION</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">使用说明</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            终末地云端自动化控制台完整使用指南与常见问题指引，帮助您快速熟悉各项功能与操作规范。
          </p>
        </header>

        {/* 快速起步三步走 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            新手快速上手
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">第一步：配置游戏账号</h3>
              <p className="text-xs leading-5 text-muted-foreground">
                前往【安全设置】，输入您的游戏账号、密码，并准确选择【官服】或【B服】。系统将安全保存您的凭据用于云端调度。
              </p>
              <Link href="/user/settings" className="inline-flex items-center text-xs font-medium text-primary hover:underline pt-1">
                去配置账号 &rarr;
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">第二步：兑换授权卡密</h3>
              <p className="text-xs leading-5 text-muted-foreground">
                前往【CDK兑换】，输入您获得的授权码，点击立即兑换。到期时间与可用立刻作战次数将即时同步至您的控制台。
              </p>
              <Link href="/user/cdk" className="inline-flex items-center text-xs font-medium text-primary hover:underline pt-1">
                去兑换 CDK &rarr;
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Sliders className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">第三步：开启任务调度</h3>
              <p className="text-xs leading-5 text-muted-foreground">
                在【首页】开启您所需作战项目（如每日签到、体能消耗、据点交易等），或点击【立刻执行】进行单次即时作战。
              </p>
              <Link href="/user/dashboard" className="inline-flex items-center text-xs font-medium text-primary hover:underline pt-1">
                前往控制台首页 &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* 核心功能详解 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            核心功能详解
          </h2>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden shadow-sm">
            <div className="p-5 flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">腾讯云轻量风格卡片与操作</h3>
                <p className="text-xs leading-5 text-muted-foreground">
                  控制台首页顶部整合了腾讯云轻量服务器风格的信息卡片：展示账号在线状态、理智储备、到期时间与立刻作战次数。卡片底栏支持【立即执行】、【任务日志】以及【冻结账户开关】。冻结账户后将暂停所有自动巡检，解除冻结后自动恢复。
                </p>
              </div>
            </div>

            <div className="p-5 flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                <Sliders className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">任务配置与高级参数</h3>
                <p className="text-xs leading-5 text-muted-foreground">
                  首页卡片下方为一体化任务配置区，包含 16 项日常任务开关及 9 项高级策略（如据点交易策略、体能药剂使用策略、设备休眠间隔等）。调整配置后点击底部的【保存配置】即可生效。
                </p>
              </div>
            </div>

            <div className="p-5 flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                <Bell className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">推送通知与异常告警</h3>
                <p className="text-xs leading-5 text-muted-foreground">
                  前往【通知设置】可绑定微信（WxPusher）、QQ 或邮件通道。当任务执行完成、出现密码变更报错或账号到期前，系统将第一时间推送告警信息至您的设备。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 常见问题 FAQ */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </span>
            常见问题排查（FAQ）
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                点击【立即执行】为什么没有立刻反应？
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                云端任务会进入执行调度队列，服务器将在 10~30 秒内唤醒对应终端开始作战，您可以在【运行记录】中随时刷新查看实时步骤。
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                自己在手机/PC上号时会冲突吗？
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                正常游戏上号会顶掉云端会话。如需长时间手动游玩，建议在首页卡片底栏开启【冻结账户】，游玩完毕后再关闭冻结即可。
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                提示“授权已过期”该如何处理？
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                前往【CDK兑换】页面，输入新的有效授权卡密完成充值，系统会自动恢复全量作战服务。
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                更换了游戏密码后如何同步？
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                前往【安全设置】，输入新的游戏账号密码并保存，后续所有云端作战将自动采用新凭据登录。
              </p>
            </div>
          </div>
        </section>

        {/* 官方交流群与工单反馈 */}
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">仍有疑问？加入官方交流群或提交工单</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                官方交流群每日同步最新策略与活动更新，有技术疑问随时交流反馈。
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Button onClick={copyQGroup} variant="outline" className="gap-1.5 bg-background">
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? "已复制群号" : "复制 Q 群：866545280"}
              </Button>
              <Button asChild>
                <Link href="/user/feedback" className="gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  提交工单
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </DashboardLayout>
  )
}

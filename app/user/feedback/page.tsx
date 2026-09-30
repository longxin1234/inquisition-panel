"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ClipboardCopy, FileClock, MessageSquare, RotateCcw } from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export default function UserFeedbackPage() {
  const { toast } = useToast()
  const [category, setCategory] = useState("运行异常")
  const [title, setTitle] = useState("")
  const [detail, setDetail] = useState("")
  const [contact, setContact] = useState("")

  const report = useMemo(() => [
    `问题类型：${category}`,
    `问题标题：${title || "未填写"}`,
    `问题描述：${detail || "未填写"}`,
    `联系方式：${contact || "未填写"}`,
  ].join("\n"), [category, contact, detail, title])

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report)
      toast({ variant: "success", title: "工单内容已复制", description: "可粘贴到客服或项目群中提交" })
    } catch {
      toast({ variant: "destructive", title: "复制失败", description: "请手动选择反馈内容" })
    }
  }

  const reset = () => {
    setCategory("运行异常")
    setTitle("")
    setDetail("")
    setContact("")
  }

  return (
    <DashboardLayout contentClassName="max-w-3xl">
      <main className="space-y-5">
        <header className="border-b border-border pb-5">
          <p className="text-xs font-semibold tracking-[0.14em] text-sky-700 dark:text-sky-300">SUPPORT TICKET</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">工单反馈</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">整理问题后复制提交，运行记录中的时间和错误信息会更方便定位。</p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <MessageSquare className="h-5 w-5 text-sky-600 dark:text-sky-300" aria-hidden="true" />
            <div><h2 className="text-base font-semibold">新建反馈</h2><p className="mt-0.5 text-xs text-muted-foreground">提交前请尽量描述复现步骤和发生时间</p></div>
          </div>
          <div className="space-y-5 px-5 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="feedback-category">问题类型</Label><Select value={category} onValueChange={setCategory}><SelectTrigger id="feedback-category"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="运行异常">运行异常</SelectItem><SelectItem value="登录问题">登录问题</SelectItem><SelectItem value="配置问题">配置问题</SelectItem><SelectItem value="功能建议">功能建议</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="feedback-title">问题标题</Label><Input id="feedback-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：任务一直停在登录页" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="feedback-detail">问题描述</Label><Textarea id="feedback-detail" value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="请填写复现步骤、页面提示和大致发生时间" className="min-h-36 resize-y" /></div>
            <div className="space-y-2"><Label htmlFor="feedback-contact">联系方式（可选）</Label><Input id="feedback-contact" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="方便回复的联系方式" /></div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <Button asChild variant="link" className="h-auto px-0 text-sky-700 dark:text-sky-300"><Link href="/user/logs"><FileClock className="mr-2 h-4 w-4" />先查看运行记录</Link></Button>
              <div className="flex gap-2"><Button type="button" variant="outline" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />清空</Button><Button type="button" onClick={() => void copyReport()}><ClipboardCopy className="mr-2 h-4 w-4" />复制工单内容</Button></div>
            </div>
          </div>
        </section>
      </main>
    </DashboardLayout>
  )
}

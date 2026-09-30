"use client"

import React, { useEffect, useState } from "react"
import { Bell, ChevronRight, Copy, Check, X, ShieldAlert, Sparkles, MessageCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { apiRequest } from "@/lib/api-config"

export interface AnnouncementItem {
  id: string
  title: string
  dateText: string
  content: string
  tag?: string
}

const DEFAULT_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: "q-group",
    title: "Q群866545280",
    dateText: "官方交流群",
    content: "终末地云控官方交流反馈 Q 群：866545280。欢迎加入群聊获取最新脚本策略、更新公告及使用答疑！",
    tag: "群聊",
  },
  {
    id: "v2-update",
    title: "控制台导航与主题全新升级",
    dateText: "最新",
    content: "1. 侧边栏全面适配柔雾奶白（浅色）与暗碳烟墨黑（深色）；\n2. 增加侧边栏快捷折叠与展开能力；\n3. CDK兑换、通知设置、使用说明独立成页；\n4. 整合右上角系统公告直通弹窗。",
    tag: "更新",
  },
]

export function AnnouncementDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(DEFAULT_ANNOUNCEMENTS)
  const [activeItem, setActiveItem] = useState<AnnouncementItem | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) {
      setActiveItem(null)
      return
    }

    // 尝试拉取线上最新公告
    apiRequest("/getAnnouncement", { method: "GET" })
      .then((res) => {
        if (res.code === 200 && res.data) {
          const remote = res.data as { title?: string; context?: string }
          if (remote.title || remote.context) {
            const newItem: AnnouncementItem = {
              id: "remote-latest",
              title: remote.title || "系统公告",
              dateText: "最新",
              content: remote.context || "暂无详细内容",
              tag: "公告",
            }
            setAnnouncements([newItem, ...DEFAULT_ANNOUNCEMENTS])
          }
        }
      })
      .catch(() => {
        // 出错保留默认列表
      })
  }, [open])

  const copyQGroup = () => {
    navigator.clipboard.writeText("866545280")
    setCopied(true)
    toast({ title: "复制成功", description: "群号 866545280 已复制到剪贴板" })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-2xl border border-border/80 bg-card p-0 shadow-2xl">
        {/* 对齐图3的深雅卡片风格头部 */}
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 shadow-sm shadow-blue-500/30">
              <Bell className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              公告
            </DialogTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="关闭公告"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 内容主体 */}
        <div className="max-h-[68vh] overflow-y-auto p-4 sm:p-5">
          {activeItem ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                &larr; 返回公告列表
              </button>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">{activeItem.title}</h3>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {activeItem.dateText}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/85">
                  {activeItem.content}
                </p>

                {activeItem.id === "q-group" && (
                  <div className="mt-4 flex items-center gap-2 pt-2 border-t border-border/50">
                    <Button size="sm" onClick={copyQGroup} className="h-8 gap-1.5">
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "已复制" : "一键复制群号"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className="group flex cursor-pointer items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3.5 transition-all hover:border-primary/40 hover:bg-muted/60"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setActiveItem(item)
                    }
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {item.id === "q-group" ? (
                        <MessageCircle className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.dateText}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

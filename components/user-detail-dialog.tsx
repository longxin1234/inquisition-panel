"use client"

import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Calendar, RefreshCw, Server, Shield, Zap, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createScriptConfig, SCRIPT_TASKS } from "@/lib/endfield-script-config"

interface UserAccount {
  id: number
  name: string
  gameName?: string
  account: string
  freeze: number
  server: number
  taskType: string
  refresh: number
  agent: string | null
  createTime: string
  updateTime: string
  expireTime: string
  san?: string
  config: any
  active?: any
  notice?: any
}

interface UserDetailDialogProps {
  user: UserAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onResetRefresh?: (id: number) => void
}

export function UserDetailDialog({ user, open, onOpenChange, onResetRefresh }: UserDetailDialogProps) {
  if (!user) return null

  const formatDate = (dateString?: string) => {
    if (!dateString) return "未记录"
    try {
      return new Date(dateString).toLocaleString("zh-CN")
    } catch {
      return dateString
    }
  }

  const isExpired = (expireTime?: string) => {
    if (!expireTime) return false
    return new Date(expireTime) < new Date()
  }

  const scriptConfig = createScriptConfig(user.config)
  const enabledTasks = SCRIPT_TASKS.filter((t) => scriptConfig.selection[t.id])
  const staminaItems: any[] = Array.isArray(scriptConfig.advancedConfig?.stamina_clear?.stage_items)
    ? scriptConfig.advancedConfig.stamina_clear.stage_items
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <User className="h-5 w-5 text-primary" />
            用户详情 - {user.name} ({user.account})
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">查看终末地账号信息与当前自动化配置</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border">
          <div className="text-xs text-muted-foreground">
            立刻作战可用次数：<span className="font-semibold text-foreground text-sm">{user.refresh ?? 0}</span> 次
          </div>
          {onResetRefresh && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => onResetRefresh(user.id)}
            >
              <RefreshCw className="h-3 w-3" />
              重置刷新次数
            </Button>
          )}
        </div>

        <div className="space-y-4 text-xs">
          {/* 基本信息 */}
          <div>
            <h3 className="text-sm font-semibold mb-2 dark:text-white">账号基本信息</h3>
            <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border dark:border-gray-700 bg-card">
              <div><span className="text-muted-foreground">用户名：</span><span className="font-medium text-foreground">{user.name}</span></div>
              <div><span className="text-muted-foreground">游戏昵称：</span><span className="font-medium text-foreground">{user.gameName || "未同步"}</span></div>
              <div><span className="text-muted-foreground">终末地账号：</span><span className="font-medium text-foreground">{user.account}</span></div>
              <div><span className="text-muted-foreground">服务器：</span><span className="font-medium text-foreground">{user.server === 0 ? "官服" : "B服"}</span></div>
              <div>
                <span className="text-muted-foreground">账号状态：</span>
                <Badge variant={user.freeze ? "destructive" : "default"} className="ml-1 text-[11px] h-4">
                  {user.freeze ? "已冻结" : "正常"}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">到期状态：</span>
                <Badge variant={isExpired(user.expireTime) ? "destructive" : "secondary"} className="ml-1 text-[11px] h-4">
                  {isExpired(user.expireTime) ? "已到期" : "有效"}
                </Badge>
              </div>
            </div>
          </div>

          {/* 时间信息 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg border dark:border-gray-700">
              <span className="text-muted-foreground block text-[11px]">创建时间</span>
              <span className="font-medium text-foreground text-xs">{formatDate(user.createTime)}</span>
            </div>
            <div className="p-2.5 rounded-lg border dark:border-gray-700">
              <span className="text-muted-foreground block text-[11px]">更新时间</span>
              <span className="font-medium text-foreground text-xs">{formatDate(user.updateTime)}</span>
            </div>
            <div className="p-2.5 rounded-lg border dark:border-gray-700">
              <span className="text-muted-foreground block text-[11px]">到期时间</span>
              <span className="font-medium text-foreground text-xs">{formatDate(user.expireTime)}</span>
            </div>
          </div>

          <Separator />

          {/* 终末地任务队列 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                已开启的自动化任务 ({enabledTasks.length}/{SCRIPT_TASKS.length})
              </h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {enabledTasks.length > 0 ? (
                enabledTasks.map((t) => (
                  <Badge key={t.id} variant="secondary" className="text-xs font-normal">
                    {t.label}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-xs">未开启任何任务</span>
              )}
            </div>
          </div>

          {/* 刷体力队列 */}
          <div>
            <h3 className="text-sm font-semibold mb-2 dark:text-white flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              刷体力关卡队列 ({staminaItems.length} 个)
            </h3>
            {staminaItems.length > 0 ? (
              <div className="space-y-1.5">
                {staminaItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded border dark:border-gray-700 text-xs">
                    <span className="font-medium">
                      #{idx + 1} {item.stage_type || item.stage_name} · {item.stage_level || "自动选关"}
                    </span>
                    <span className="text-muted-foreground">×{item.max_runs ?? 99} 次</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">暂无配置关卡</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

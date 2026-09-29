"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Calendar, Zap, RefreshCw, Server, Shield, Mail, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UserAccount {
  id: number
  name: string
  account: string
  password: string
  freeze: number
  server: number
  taskType: string
  refresh: number
  agent: string | null
  createTime: string
  updateTime: string
  expireTime: string
  san: string
  config: any
  active: any
  notice: any
}

interface UserDetailDialogProps {
  user: UserAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onResetRefresh?: (id: number) => void
  onResetSanity?: (id: number) => void
}

export function UserDetailDialog({ user, open, onOpenChange, onResetRefresh, onResetSanity }: UserDetailDialogProps) {
  if (!user) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN")
  }

  const isExpired = (expireTime: string) => {
    return new Date(expireTime) < new Date()
  }

  const getTaskTypeName = (taskType: string) => {
    const taskTypes: Record<string, string> = {
      daily: "日常任务",
      rogue: "肉鸽任务",
      sand_fire: "生息演算",
    }
    return taskTypes[taskType] || taskType
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <User className="h-5 w-5" />
            用户详情 - {user.name}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">查看用户的详细信息和配置</DialogDescription>
        </DialogHeader>

        <div className="mb-6">
          <h3 className="text-base font-semibold mb-2 dark:text-white">快捷操作</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => onResetRefresh && onResetRefresh(user.id)}
            >
              重置刷新次数
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => onResetSanity && onResetSanity(user.id)}
            >
              重置理智
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 dark:text-white">基本信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">用户名:</span>
                  <span className="font-medium dark:text-white">{user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">账号:</span>
                  <span className="font-medium dark:text-white">{user.account}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">服务器:</span>
                  <span className="font-medium dark:text-white">{user.server === 0 ? "官服" : "B服"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">任务类型:</span>
                  <span className="font-medium dark:text-white">{getTaskTypeName(user.taskType)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">状态:</span>
                  <Badge variant={user.freeze ? "destructive" : "default"}>{user.freeze ? "已冻结" : "正常"}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">理智:</span>
                  <span className="font-medium dark:text-white">{user.san}</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">刷新次数:</span>
                  <span className="font-medium dark:text-white">{user.refresh}</span>
                </div>
                {Number(user.agent) > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">代理:</span>
                    <span className="font-medium dark:text-white">{user.agent}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="dark:bg-gray-600" />

          <div>
            <h3 className="text-lg font-semibold mb-3 dark:text-white">时间信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">创建时间</p>
                  <p className="font-medium dark:text-white">{formatDate(user.createTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">更新时间</p>
                  <p className="font-medium dark:text-white">{formatDate(user.updateTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">到期时间</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium dark:text-white">{formatDate(user.expireTime)}</p>
                    <Badge variant={isExpired(user.expireTime) ? "destructive" : "secondary"}>
                      {isExpired(user.expireTime) ? "已到期" : "有效"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="dark:bg-gray-600" />

          {user.notice && (
            <div>
              <h3 className="text-lg font-semibold mb-3 dark:text-white">通知设置</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">微信通知</p>
                    <p className="font-medium dark:text-white">
                      {user.notice.wxUID?.enable ? user.notice.wxUID.text || "已启用" : "未启用"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">QQ通知</p>
                    <p className="font-medium dark:text-white">
                      {user.notice.qq?.enable ? user.notice.qq.text || "已启用" : "未启用"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">邮件通知</p>
                    <p className="font-medium dark:text-white">
                      {user.notice.mail?.enable ? user.notice.mail.text || "已启用" : "未启用"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator className="dark:bg-gray-600" />

          {user.active && (
            <div>
              <h3 className="text-lg font-semibold mb-3 dark:text-white">活跃时间设置</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {Object.entries(user.active).map(([day, config]: [string, any]) => {
                  const dayNames: Record<string, string> = {
                    monday: "周一",
                    tuesday: "周二",
                    wednesday: "周三",
                    thursday: "周四",
                    friday: "周五",
                    saturday: "周六",
                    sunday: "周日",
                  }
                  return (
                    <div key={day} className="text-center p-2 border rounded dark:border-gray-600">
                      <p className="text-sm font-medium dark:text-white">{dayNames[day]}</p>
                      <Badge variant={config.enable ? "default" : "secondary"} className="mt-1">
                        {config.enable ? "启用" : "禁用"}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

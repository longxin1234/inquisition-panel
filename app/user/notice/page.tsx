"use client"

import { useEffect, useState } from "react"
import { Bell, Mail, MessageSquare, Save, CheckCircle2, Info } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { apiRequestWithAuth, getStoredToken, isSessionFailureError, isTokenValid } from "@/lib/api-config"

type NoticeChannel = { text: string; enable: boolean }
type NoticeState = { wxUID: NoticeChannel; qq: NoticeChannel; mail: NoticeChannel }
type AccountSnapshot = { config?: Record<string, any>; active?: Record<string, any>; notice?: Partial<NoticeState> }

const EMPTY_NOTICE: NoticeState = {
  wxUID: { text: "", enable: false },
  qq: { text: "", enable: false },
  mail: { text: "", enable: false },
}

function normalizeNotice(notice?: Partial<NoticeState>): NoticeState {
  return {
    wxUID: { ...EMPTY_NOTICE.wxUID, ...(notice?.wxUID || {}) },
    qq: { ...EMPTY_NOTICE.qq, ...(notice?.qq || {}) },
    mail: { ...EMPTY_NOTICE.mail, ...(notice?.mail || {}) },
  }
}

export default function UserNoticePage() {
  const { token: contextToken } = useAuth()
  const { toast } = useToast()
  const [accountSnapshot, setAccountSnapshot] = useState<AccountSnapshot | null>(null)
  const [notice, setNotice] = useState<NoticeState>(EMPTY_NOTICE)
  const [noticeLoading, setNoticeLoading] = useState(true)
  const [noticeSaving, setNoticeSaving] = useState(false)

  const getToken = () => contextToken || getStoredToken()

  useEffect(() => {
    const token = getToken()
    if (!token || !isTokenValid(token)) {
      setNoticeLoading(false)
      return
    }

    apiRequestWithAuth("/showMyAccount", token, { method: "GET" })
      .then((result) => {
        if (result.code !== 200) throw new Error(result.msg || "读取账号信息失败")
        const data = result.data as AccountSnapshot
        setAccountSnapshot(data)
        setNotice(normalizeNotice(data.notice))
      })
      .catch((error) => {
        const isSwitchedMode = typeof window !== "undefined" && window.localStorage?.getItem("admin_switched_mode") === "user"
        if (isSwitchedMode || isSessionFailureError(error)) {
          // 管理员预览模式或未登录状态静默使用默认空配置，绝不弹出红色错误干扰用户
          return
        }
        toast({
          variant: "destructive",
          title: "通知设置加载失败",
          description: error instanceof Error ? error.message : "请稍后重试",
        })
      })
      .finally(() => setNoticeLoading(false))
  }, [contextToken, toast])

  const handleSaveNotice = async () => {
    const isSwitchedMode = typeof window !== "undefined" && window.localStorage?.getItem("admin_switched_mode") === "user"
    if (isSwitchedMode) {
      toast({
        title: "管理员预览模式",
        description: "当前为管理员预览视图，请使用普通游戏账号登录后保存设置",
      })
      return
    }

    const token = getToken()
    if (!token || !isTokenValid(token) || !accountSnapshot) {
      toast({ variant: "destructive", title: "认证失败", description: "请重新登录" })
      return
    }

    setNoticeSaving(true)
    try {
      const result = await apiRequestWithAuth("/updateMyAccount", token, {
        method: "POST",
        body: JSON.stringify({
          config: accountSnapshot.config || {},
          active: accountSnapshot.active || {},
          notice,
        }),
        headers: { "Content-Type": "application/json" },
      })

      if (result.code !== 200) throw new Error(result.msg || "通知设置保存失败")
      setAccountSnapshot((current) => (current ? { ...current, notice } : current))
      toast({ variant: "success", title: "保存成功", description: "通知推送设置已成功更新" })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "保存失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      })
    } finally {
      setNoticeSaving(false)
    }
  }

  return (
    <DashboardLayout contentClassName="max-w-5xl">
      <main className="space-y-6">
        <header className="border-b border-border pb-5">
          <p className="text-xs font-semibold tracking-[0.14em] text-primary">NOTIFICATIONS & ALERTS</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">通知设置</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            配置作战任务完成、异常告警与重要事件的消息推送通道。支持微信、QQ以及邮件多种提醒方式。
          </p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border bg-muted/20 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">推送渠道配置</h2>
                <p className="text-xs text-muted-foreground">开启开关并填入接收账号即可接收任务提醒</p>
              </div>
            </div>
            <Button
              onClick={handleSaveNotice}
              disabled={noticeLoading || noticeSaving}
              size="sm"
              className="gap-1.5 shrink-0"
            >
              <Save className="h-4 w-4" />
              {noticeSaving ? "保存中..." : "保存设置"}
            </Button>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-3">
            <NoticeCard
              icon={MessageSquare}
              label="微信通知"
              description="通过 WxPusher 渠道推送"
              value={notice.wxUID}
              placeholder="请输入微信 UID"
              disabled={noticeLoading || noticeSaving}
              onChange={(next) => setNotice((curr) => ({ ...curr, wxUID: next }))}
            />
            <NoticeCard
              icon={MessageSquare}
              label="QQ 通知"
              description="机器人消息直接私聊推送"
              value={notice.qq}
              placeholder="请输入接收 QQ 号"
              disabled={noticeLoading || noticeSaving}
              onChange={(next) => setNotice((curr) => ({ ...curr, qq: next }))}
            />
            <NoticeCard
              icon={Mail}
              label="邮件通知"
              description="发送执行摘要至电子邮箱"
              value={notice.mail}
              placeholder="请输入接收邮箱地址"
              disabled={noticeLoading || noticeSaving}
              onChange={(next) => setNotice((curr) => ({ ...curr, mail: next }))}
            />
          </div>

          <div className="border-t border-border bg-muted/10 p-5">
            <div className="flex items-start gap-3 text-xs leading-5 text-muted-foreground">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">推送配置提示：</p>
                <p>1. 微信通知需填入对应 WxPusher 的 UID，关注官方推送公众号即可接收任务卡片；</p>
                <p>2. QQ 通知请确保账号已允许临时会话或已添加机器人好友；</p>
                <p>3. 建议至少开启一种常用推送渠道，以便在账号授权即将到期或作战异常时及时收到告警。</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </DashboardLayout>
  )
}

function NoticeCard({
  icon: Icon,
  label,
  description,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  icon: typeof MessageSquare
  label: string
  description: string
  value: NoticeChannel
  placeholder: string
  disabled: boolean
  onChange: (value: NoticeChannel) => void
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-background/50 p-4 transition-all hover:border-border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-[11px] text-muted-foreground">{description}</p>
          </div>
        </div>
        <Switch
          checked={value.enable}
          onCheckedChange={(enable) => onChange({ ...value, enable })}
          disabled={disabled}
          aria-label={`启用${label}`}
        />
      </div>
      <Input
        value={value.text}
        onChange={(event) => onChange({ ...value, text: event.target.value })}
        disabled={disabled}
        placeholder={placeholder}
        className="h-10 text-sm"
      />
    </div>
  )
}

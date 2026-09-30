"use client"

import { useEffect, useState } from "react"
import { ArrowRight, CheckCircle2, Gift, KeyRound, Sparkles, AlertCircle, Clock } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { apiRequestWithAuth, getStoredToken, isTokenValid } from "@/lib/api-config"

interface AccountData {
  config?: Record<string, any>
  active?: {
    expiredTime?: string
    remainCount?: number
    [key: string]: any
  }
}

export default function UserCdkPage() {
  const { token: contextToken } = useAuth()
  const { toast } = useToast()
  const [cdk, setCdk] = useState("")
  const [cdkLoading, setCdkLoading] = useState(false)
  const [accountInfo, setAccountInfo] = useState<AccountData | null>(null)
  const [infoLoading, setInfoLoading] = useState(true)

  const getToken = () => contextToken || getStoredToken()

  const loadAccountInfo = () => {
    const token = getToken()
    if (!token || !isTokenValid(token)) {
      setInfoLoading(false)
      return
    }

    apiRequestWithAuth("/showMyAccount", token, { method: "GET" })
      .then((res) => {
        if (res.code === 200 && res.data) {
          setAccountInfo(res.data as AccountData)
        }
      })
      .catch(() => {})
      .finally(() => setInfoLoading(false))
  }

  useEffect(() => {
    loadAccountInfo()
  }, [contextToken])

  const handleCdkActivate = async () => {
    const token = getToken()
    if (!token || !isTokenValid(token)) {
      toast({ variant: "destructive", title: "认证失败", description: "请重新登录" })
      return
    }

    const trimmedCdk = cdk.trim()
    if (!trimmedCdk) {
      toast({ variant: "destructive", title: "请输入授权码", description: "CDK 不能为空" })
      return
    }

    setCdkLoading(true)
    try {
      const result = await apiRequestWithAuth("/useCDK", token, {
        method: "POST",
        body: JSON.stringify({ cdk: trimmedCdk }),
        headers: { "Content-Type": "application/json" },
      })

      if (result.code !== 200) {
        throw new Error(result.msg || "授权码激活失败")
      }

      toast({
        variant: "success",
        title: "兑换成功",
        description: result.msg || "授权额度已成功充入您的账号！",
      })
      setCdk("")
      loadAccountInfo()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "兑换失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      })
    } finally {
      setCdkLoading(false)
    }
  }

  const expiredTime = accountInfo?.active?.expiredTime || "未设置"
  const remainCount = accountInfo?.active?.remainCount ?? 0

  return (
    <DashboardLayout contentClassName="max-w-5xl">
      <main className="space-y-6">
        <header className="border-b border-border pb-5">
          <p className="text-xs font-semibold tracking-[0.14em] text-primary">LICENSE & RECHARGE</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">CDK 兑换</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            在此输入您的授权卡密或兑换码，充值生效后将立即延长账号可用天数或追加作战次数。
          </p>
        </header>

        {/* 当前授权状态快速看板 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">授权到期时间</p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                  {infoLoading ? "读取中..." : expiredTime}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">立刻作战可用次数</p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                  {infoLoading ? "读取中..." : `${remainCount} 次`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CDK 兑换核心卡片 */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-muted/20 px-6 py-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">激活卡密授权</h2>
                <p className="text-xs text-muted-foreground">请核对卡密字符无空格遗漏后点击兑换</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="cdk-input" className="text-sm font-medium">
                授权卡密（CDK）
              </Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  id="cdk-input"
                  value={cdk}
                  onChange={(e) => setCdk(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !cdkLoading) {
                      handleCdkActivate()
                    }
                  }}
                  disabled={cdkLoading}
                  placeholder="在此输入或粘贴您的授权 CDK 码"
                  autoComplete="off"
                  className="h-12 flex-1 text-base tracking-wide"
                />
                <Button
                  onClick={handleCdkActivate}
                  disabled={cdkLoading}
                  size="lg"
                  className="h-12 px-6 shrink-0 font-medium"
                >
                  {cdkLoading ? "正在验证..." : "立即兑换"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-sky-200/80 bg-sky-50/60 p-4 dark:border-sky-900/60 dark:bg-sky-950/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
                <div className="text-xs leading-5 text-sky-900 dark:text-sky-200">
                  <p className="font-medium">兑换说明：</p>
                  <p>1. 兑换码通常为一次性使用凭据，成功兑换后对应额度或天数将立即累加至当前账号；</p>
                  <p>2. 如遇“授权码无效或已使用”，请先确认是否有误输入多余空格，或联系管理员/官方Q群核实。</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </DashboardLayout>
  )
}

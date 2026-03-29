"use client"

import { cn } from "@/lib/utils"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { apiRequestWithAuth, getStoredToken } from "@/lib/api-config"
import { Loader2 } from "lucide-react"

interface AnnouncementData {
  context: string
  title: string
  md5: string
}

interface AnnouncementResponse {
  code: number
  msg: string
  data: AnnouncementData
}

interface AdminNoticeConfigData {
  wxPusherEnable: boolean
  wxPusherUid: string
  pushPlusEnable: boolean
  pushPlusToken: string
  mailEnable: boolean
  adminMail: string
  summarySchedule: string
}

interface AdminNoticeConfigResponse {
  code: number
  msg: string
  data: AdminNoticeConfigData
}

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [currentTitle, setCurrentTitle] = useState("")
  const [currentContext, setCurrentContext] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newContext, setNewContext] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNoticeLoading, setIsNoticeLoading] = useState(false)
  const [isNoticeSubmitting, setIsNoticeSubmitting] = useState(false)
  const [noticeConfig, setNoticeConfig] = useState<AdminNoticeConfigData>({
    wxPusherEnable: false,
    wxPusherUid: "",
    pushPlusEnable: false,
    pushPlusToken: "",
    mailEnable: false,
    adminMail: "",
    summarySchedule: "00:00 / 08:00 / 12:00 / 16:00 / 18:00",
  })

  const fetchAnnouncement = async () => {
    setIsLoading(true)
    const token = getStoredToken()
    if (!token) {
      toast({
        title: "错误",
        description: "未找到认证令牌，请重新登录。",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const response: AnnouncementResponse = await apiRequestWithAuth("/getAnnouncement", token)
      if (response.code === 200 && response.data) {
        setCurrentTitle(response.data.title)
        setCurrentContext(response.data.context)
        setNewTitle(response.data.title)
        setNewContext(response.data.context)
      } else {
        toast({
          title: "获取公告失败",
          description: response.msg || "未知错误。",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "获取公告失败",
        description: "无法连接到服务器或网络错误。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAdminNoticeConfig = async () => {
    setIsNoticeLoading(true)
    const token = getStoredToken()
    if (!token) {
      setIsNoticeLoading(false)
      return
    }

    try {
      const response: AdminNoticeConfigResponse = await apiRequestWithAuth("/getAdminNoticeConfig", token)
      if (response.code === 200 && response.data) {
        setNoticeConfig(response.data)
      } else {
        toast({
          title: "获取管理员通知配置失败",
          description: response.msg || "未知错误。",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "获取管理员通知配置失败",
        description: "无法连接到服务器或网络错误。",
        variant: "destructive",
      })
    } finally {
      setIsNoticeLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncement()
    fetchAdminNoticeConfig()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const token = getStoredToken()
    if (!token) {
      toast({
        title: "错误",
        description: "未找到认证令牌，请重新登录。",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      const response = await apiRequestWithAuth("/createAnnouncement", token, {
        method: "POST",
        body: JSON.stringify({ title: newTitle, context: newContext }),
      })

      if (response.code === 200) {
        toast({
          title: "公告更新成功",
          description: "公告已成功发布。",
        })
        await fetchAnnouncement()
      } else {
        toast({
          title: "公告更新失败",
          description: response.msg || "未知错误。",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "公告更新失败",
        description: "无法连接到服务器或网络错误。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveNoticeConfig = async () => {
    setIsNoticeSubmitting(true)
    const token = getStoredToken()
    if (!token) {
      setIsNoticeSubmitting(false)
      return
    }

    try {
      const response = await apiRequestWithAuth("/setAdminNoticeConfig", token, {
        method: "POST",
        body: JSON.stringify({
          wxPusherEnable: noticeConfig.wxPusherEnable,
          wxPusherUid: noticeConfig.wxPusherUid,
          pushPlusEnable: noticeConfig.pushPlusEnable,
          pushPlusToken: noticeConfig.pushPlusToken,
        }),
      })

      if (response.code === 200) {
        toast({
          title: "管理员通知配置已保存",
          description: response.msg || "保存成功。",
        })
        await fetchAdminNoticeConfig()
      } else {
        toast({
          title: "管理员通知配置保存失败",
          description: response.msg || "未知错误。",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "管理员通知配置保存失败",
        description: "无法连接到服务器或网络错误。",
        variant: "destructive",
      })
    } finally {
      setIsNoticeSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">其他设置</h1>

        {/* 公告管理卡片 */}
        <Card className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold dark:text-white">公告管理</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              在此管理和发布系统公告。新公告将覆盖现有公告。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">加载中...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold dark:text-white">当前公告:</h3>
                <Card className="p-4 border dark:border-gray-600 dark:bg-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    <span className="font-bold">标题:</span> {currentTitle || "无"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    <span className="font-bold">内容:</span> {currentContext || "无"}
                  </p>
                </Card>

                <Separator className="my-6 dark:bg-gray-700" />

                <h3 className="text-lg font-semibold dark:text-white">发布新公告:</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newTitle" className="dark:text-white">
                      公告标题
                    </Label>
                    <Input
                      id="newTitle"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="请输入公告标题"
                      required
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newContext" className="dark:text-white">
                      公告内容
                    </Label>
                    <Textarea
                      id="newContext"
                      value={newContext}
                      onChange={(e) => setNewContext(e.target.value)}
                      placeholder="请输入公告内容"
                      rows={5}
                      required
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        发布中...
                      </>
                    ) : (
                      "发布公告"
                    )}
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold dark:text-white">管理员通知</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              配置管理员定时汇总的接收渠道，支持邮件、WxPusher 与 PushPlus。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isNoticeLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">加载中...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="dark:text-white">汇总发送时间</Label>
                    <Input value={noticeConfig.summarySchedule} disabled className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-white">邮件接收地址</Label>
                    <Input value={noticeConfig.adminMail || "未配置"} disabled className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border p-4 dark:border-gray-600 dark:bg-gray-700">
                  <p className="font-medium dark:text-white">邮件通知</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    当前状态：{noticeConfig.mailEnable ? "已启用" : "未启用"}
                  </p>
                </div>

                <div className="space-y-3 rounded-lg border p-4 dark:border-gray-600 dark:bg-gray-700">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="wxPusherEnable"
                      checked={noticeConfig.wxPusherEnable}
                      onCheckedChange={(checked) => setNoticeConfig((prev) => ({ ...prev, wxPusherEnable: checked as boolean }))}
                    />
                    <Label htmlFor="wxPusherEnable" className="dark:text-white">
                      启用 WxPusher 通知
                    </Label>
                  </div>
                  <Input
                    value={noticeConfig.wxPusherUid}
                    onChange={(e) => setNoticeConfig((prev) => ({ ...prev, wxPusherUid: e.target.value }))}
                    placeholder="请输入 WxPusher UID"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="space-y-3 rounded-lg border p-4 dark:border-gray-600 dark:bg-gray-700">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="pushPlusEnable"
                      checked={noticeConfig.pushPlusEnable}
                      onCheckedChange={(checked) => setNoticeConfig((prev) => ({ ...prev, pushPlusEnable: checked as boolean }))}
                    />
                    <Label htmlFor="pushPlusEnable" className="dark:text-white">
                      启用 PushPlus 通知
                    </Label>
                  </div>
                  <Input
                    value={noticeConfig.pushPlusToken}
                    onChange={(e) => setNoticeConfig((prev) => ({ ...prev, pushPlusToken: e.target.value }))}
                    placeholder="请输入 PushPlus Token"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <Button type="button" onClick={handleSaveNoticeConfig} disabled={isNoticeSubmitting} className="w-full">
                  {isNoticeSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "保存管理员通知配置"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px bg-gray-200", className)} />
}

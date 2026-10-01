"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  createScriptConfig,
  scriptConfigToAccountConfig,
  type EndfieldScriptConfig,
  type ScriptSelection,
  SCRIPT_TASKS,
} from "@/lib/endfield-script-config"
import { UserEndfieldTasks } from "@/components/admin-user/user-endfield-tasks"
import { UserEndfieldStamina } from "@/components/admin-user/user-endfield-stamina"
import { UserEndfieldAdvanced } from "@/components/admin-user/user-endfield-advanced"

interface NewUserAccount {
  name: string
  account: string
  password?: string
  freeze: number
  server: number
  taskType: string
  refresh: number
  agent: string | null
  expireTime: string
  config: any
  active: any
  notice: any
  days: number
}

interface UserAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (user: NewUserAccount) => void
}

export function UserAddDialog({ open, onOpenChange, onSave }: UserAddDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    account: "",
    password: "",
    server: 0,
    days: 30,
    refresh: 1,
    agent: null as string | null,
  })
  const [script, setScript] = useState<EndfieldScriptConfig>(() => createScriptConfig({}))

  const handleSave = () => {
    if (!form.account.trim()) {
      toast({ variant: "destructive", title: "验证失败", description: "终末地账号不能为空" })
      return
    }
    if (!form.password.trim()) {
      toast({ variant: "destructive", title: "验证失败", description: "初始密码不能为空" })
      return
    }

    setLoading(true)
    try {
      const config = scriptConfigToAccountConfig({}, script)
      const expireTime = new Date(Date.now() + form.days * 24 * 60 * 60 * 1000).toISOString()
      onSave({
        name: form.name.trim() || form.account.trim(),
        account: form.account.trim(),
        password: form.password.trim(),
        freeze: 0,
        server: form.server,
        taskType: "daily",
        refresh: form.refresh,
        agent: form.agent,
        expireTime,
        config,
        active: { monday: { enable: true }, tuesday: { enable: true }, wednesday: { enable: true }, thursday: { enable: true }, friday: { enable: true }, saturday: { enable: true }, sunday: { enable: true } },
        notice: {},
        days: form.days,
      })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[88vh] overflow-y-auto dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold dark:text-white">
            <UserPlus className="h-4 w-4 text-primary" />
            添加新终末地用户
          </DialogTitle>
          <DialogDescription className="text-xs dark:text-gray-400">配置新用户账号及默认终末地自动化策略</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="basic" className="text-xs">基本信息</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">任务配置</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-3 mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <Label className="text-xs">显示用户名</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="可选，默认等于账号" className="h-8 text-xs mt-1" />
              </div>
              <div>
                <Label className="text-xs">终末地账号 *</Label>
                <Input value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} placeholder="游戏登录账号" className="h-8 text-xs mt-1" />
              </div>
              <div>
                <Label className="text-xs">登录密码 *</Label>
                <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="游戏登录密码" className="h-8 text-xs mt-1" />
              </div>
              <div>
                <Label className="text-xs">服务器类型</Label>
                <Select value={String(form.server)} onValueChange={(v) => setForm({ ...form, server: Number(v) })}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="0">官服</SelectItem><SelectItem value="1">B服</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">初始授权天数</Label>
                <Input type="number" min="1" value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) || 30 })} className="h-8 text-xs mt-1" />
              </div>
              <div>
                <Label className="text-xs">初始立刻作战次数</Label>
                <Input type="number" min="0" value={form.refresh} onChange={(e) => setForm({ ...form, refresh: Number(e.target.value) || 0 })} className="h-8 text-xs mt-1" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-4 space-y-4">
            <UserEndfieldTasks
              selection={script.selection}
              onUpdateTask={(t, en) => setScript((p) => ({ ...p, selection: { ...p.selection, [t]: en } }))}
              onSetAllTasks={(en) => {
                const s: ScriptSelection = {}
                for (const t of SCRIPT_TASKS) s[t.id] = en
                setScript((p) => ({ ...p, selection: s }))
              }}
            />
            <UserEndfieldStamina
              staminaClear={script.advancedConfig.stamina_clear}
              onChange={(next) => setScript((p) => ({ ...p, advancedConfig: { ...p.advancedConfig, stamina_clear: next } }))}
            />
            <UserEndfieldAdvanced
              advancedConfig={script.advancedConfig}
              onChange={(next) => setScript((p) => ({ ...p, advancedConfig: next }))}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4 border-t pt-3 dark:border-gray-700">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">取消</Button>
          <Button size="sm" onClick={handleSave} disabled={loading} className="h-8 text-xs">{loading ? "添加中..." : "确认添加"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

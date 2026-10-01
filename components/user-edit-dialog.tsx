"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Save, Settings, Zap, Sliders, Bell } from "lucide-react"
import {
  createScriptConfig,
  scriptConfigToAccountConfig,
  type EndfieldScriptConfig,
  type ScriptSelection,
  SCRIPT_TASKS,
} from "@/lib/endfield-script-config"
import { UserEditBasic } from "@/components/admin-user/user-edit-basic"
import { UserEndfieldTasks } from "@/components/admin-user/user-endfield-tasks"
import { UserEndfieldStamina } from "@/components/admin-user/user-endfield-stamina"
import { UserEndfieldAdvanced } from "@/components/admin-user/user-endfield-advanced"

interface UserAccount {
  id: number
  name: string
  gameName?: string
  account: string
  password?: string
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
  cooldownUntil?: string | null
}

interface UserEditDialogProps {
  user: UserAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (user: Partial<UserAccount>) => Promise<void> | void
}

export function UserEditDialog({ user, open, onOpenChange, onSave }: UserEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [editForm, setEditForm] = useState<Partial<UserAccount>>({})
  const [script, setScript] = useState<EndfieldScriptConfig | null>(null)

  useEffect(() => {
    if (user && open) {
      setEditForm({
        id: user.id,
        name: user.name,
        gameName: user.gameName,
        account: user.account,
        password: "", // 保持留空，避免覆盖
        freeze: user.freeze,
        server: user.server,
        taskType: user.taskType || "daily",
        refresh: user.refresh ?? 1,
        agent: user.agent,
        expireTime: user.expireTime,
        config: user.config || {},
        active: user.active || {},
        notice: user.notice || {},
        cooldownUntil: user.cooldownUntil || "",
      })
      setScript(createScriptConfig(user.config))
    }
  }, [user, open])

  if (!user || !script) return null

  const handleUpdateTask = (taskId: string, enabled: boolean) => {
    setScript((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        selection: { ...prev.selection, [taskId]: enabled },
      }
    })
  }

  const handleSetAllTasks = (enabled: boolean) => {
    setScript((prev) => {
      if (!prev) return prev
      const nextSelection: ScriptSelection = {}
      for (const t of SCRIPT_TASKS) nextSelection[t.id] = enabled
      return { ...prev, selection: nextSelection }
    })
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const nextConfig = scriptConfigToAccountConfig(editForm.config, script)
      const payload: Partial<UserAccount> = {
        ...editForm,
        config: nextConfig,
      }
      if (!payload.password) delete payload.password
      await onSave(payload)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <User className="h-5 w-5 text-primary" />
            编辑终末地用户 - {user.name} ({user.account})
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            修改用户账号基础状态及终末地 16 项自动化任务与高级策略
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="basic" className="text-xs">基本账号</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">任务队列</TabsTrigger>
            <TabsTrigger value="stamina" className="text-xs">刷体力配置</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">高级策略</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-4">
            <UserEditBasic form={editForm} onChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))} />
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            <UserEndfieldTasks
              selection={script.selection}
              onUpdateTask={handleUpdateTask}
              onSetAllTasks={handleSetAllTasks}
            />
          </TabsContent>

          <TabsContent value="stamina" className="mt-4">
            <UserEndfieldStamina
              staminaClear={script.advancedConfig.stamina_clear}
              onChange={(next) =>
                setScript((prev) => (prev ? { ...prev, advancedConfig: { ...prev.advancedConfig, stamina_clear: next } } : prev))
              }
            />
          </TabsContent>

          <TabsContent value="advanced" className="mt-4">
            <UserEndfieldAdvanced
              advancedConfig={script.advancedConfig}
              onChange={(next) => setScript((prev) => (prev ? { ...prev, advancedConfig: next } : prev))}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4 border-t pt-3 dark:border-gray-700">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading} className="gap-1.5">
            <Save className="h-4 w-4" />
            {loading ? "保存中..." : "保存配置"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

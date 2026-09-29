"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Calendar, DollarSign, Percent, Key, Shield, Info } from "lucide-react"
import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ProUser {
  id: number
  username: string
  password?: string
  permission: string
  balance: number
  discount: number
  authorization: string
  expireTime: string
  delete: number
}

interface AgentDetailDialogProps {
  agent: ProUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgentDetailDialog({ agent, open, onOpenChange, onSave }: AgentDetailDialogProps & { onSave?: (data: Partial<ProUser>) => Promise<void> }) {
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    username: agent?.username ?? "",
    password: "",
    balance: agent?.balance ?? 0,
    discount: agent?.discount ?? 0,
    expireTime: agent?.expireTime ?? ""
  })

  React.useEffect(() => {
    setForm({
      username: agent?.username ?? "",
      password: "",
      balance: agent?.balance ?? 0,
      discount: agent?.discount ?? 0,
      expireTime: agent?.expireTime ?? ""
    })
  }, [agent])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === "balance" || name === "discount" ? Number(value) : value }))
  }

  const handleSave = async () => {
    if (onSave && agent) {
      const dataToSave: Partial<ProUser & { password?: string }> = { id: agent.id, ...form }
      if (!form.password) {
        delete dataToSave.password
      }
      await onSave(dataToSave)
      setEditMode(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleString("zh-CN")
    } catch (e) {
      return "无效日期"
    }
  }

  if (!agent) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <Info className="h-5 w-5" />
            代理用户详情 - {agent.username}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">查看代理用户的详细信息</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 dark:text-white">基本信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">账户名:</span>
                  {editMode ? (
                    <Input name="username" value={form.username} onChange={handleChange} className="w-48 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  ) : (
                    <span className="font-medium dark:text-white">{agent.username}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">权限等级:</span>
                  <span className="font-medium dark:text-white">{agent.permission}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">余额:</span>
                  {editMode ? (
                    <Input name="balance" type="number" value={form.balance} onChange={handleChange} className="w-32 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  ) : (
                    <span className="font-medium dark:text-white">{agent.balance.toFixed(2)}</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">状态:</span>
                  <Badge variant={agent.delete === 1 ? "destructive" : "default"}>
                    {agent.delete === 1 ? "已删除" : "活跃"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-primary" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">折扣:</span>
                  {editMode ? (
                    <Input name="discount" type="number" step="0.01" min="0" max="1" value={form.discount} onChange={handleChange} className="w-24 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  ) : (
                    <span className="font-medium dark:text-white">{(agent.discount * 100).toFixed(0)}%</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">授权码:</span>
                  <span className="font-medium dark:text-white break-all">{agent.authorization}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="dark:bg-gray-600" />

          <div>
            <h3 className="text-lg font-semibold mb-3 dark:text-white">时间信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">到期时间</p>
                  {editMode ? (
                    <Input name="expireTime" type="datetime-local" value={form.expireTime?.slice(0, 16)} onChange={handleChange} className="w-60 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  ) : (
                    <p className="font-medium dark:text-white">{formatDate(agent.expireTime)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {editMode && (
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">新密码:</span>
              <Input name="password" type="password" value={form.password} onChange={handleChange} placeholder="留空则不修改" className="w-48 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            {editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)}>取消</Button>
                <Button onClick={handleSave}>保存</Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)}>编辑</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"
import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface AgentAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => void
}

export function AgentAddDialog({ open, onOpenChange, onSave }: AgentAddDialogProps) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    username: "",
    password: "",
    permission: "pro",
    balance: 0,
    discount: 1,
    expireTime: "2099-12-31T00:00:00.000Z",
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!form.username || !form.password) {
      toast({ variant: "destructive", title: "请填写账户和密码" })
      return
    }
    setLoading(true)
    try {
      await onSave(form)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">新增代理用户</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">创建新的代理账户并配置初始权限与余额。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="username" className="dark:text-white">账户</Label>
            <Input id="username" name="username" value={form.username} onChange={handleChange} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <Label htmlFor="password" className="dark:text-white">密码</Label>
            <Input id="password" name="password" type="text" value={form.password} onChange={handleChange} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <Label className="dark:text-white">权限</Label>
            <Input value="pro" disabled className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <Label htmlFor="balance" className="dark:text-white">余额</Label>
            <Input id="balance" name="balance" type="number" value={form.balance} onChange={handleChange} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <Label htmlFor="expireTime" className="dark:text-white">到期时间</Label>
            <Input id="expireTime" name="expireTime" type="text" value={form.expireTime} disabled className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>取消</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? "保存中..." : "添加用户"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
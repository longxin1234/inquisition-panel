"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface SubUserAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { account: string; password: string; server: number; days: number; name?: string }) => void
}

export function ProuserSubuserAddDialog({ open, onOpenChange, onSave }: SubUserAddDialogProps) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    account: "",
    password: "",
    server: 0,
    days: 30,
    name: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!form.account || !form.password) {
      toast({ variant: "destructive", title: "账号和密码为必填项" })
      return
    }
    setLoading(true)
    try {
      const payload = {
        account: form.account,
        password: form.password,
        server: form.server,
        days: form.days,
        ...(form.name ? { name: form.name } : {}),
      }
      await onSave(payload)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">创建附属用户</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">为下级客户添加附属游戏账号与有效期。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="dark:text-white">用户名（可选）</Label>
            <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <Label htmlFor="account" className="dark:text-white">账号</Label>
            <Input id="account" value={form.account} onChange={e => setForm({ ...form, account: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <Label htmlFor="password" className="dark:text-white">密码</Label>
            <Input id="password" type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <Label className="dark:text-white">服务器</Label>
            <Select value={form.server.toString()} onValueChange={value => setForm({ ...form, server: Number(value) })}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <SelectValue placeholder="选择服务器" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">官服</SelectItem>
                <SelectItem value="1">B服</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="days" className="dark:text-white">有效天数</Label>
            <Input id="days" type="number" min={1} value={form.days} onChange={e => setForm({ ...form, days: Number(e.target.value) || 1 })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
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
"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface UserEditBasicProps {
  form: Record<string, any>
  onChange: (patch: Record<string, any>) => void
}

export function UserEditBasic({ form, onChange }: UserEditBasicProps) {
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return ""
    if (dateString.includes("T") && !dateString.endsWith("Z")) {
      return dateString.slice(0, 16)
    }
    try {
      const d = new Date(dateString)
      if (Number.isNaN(d.getTime())) return dateString
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000)
      return local.toISOString().slice(0, 16)
    } catch {
      return ""
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 py-1">
      {/* 左侧列：用户名、密码、服务器、代理、冻结账号（紧凑型 text-xs / h-8） */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="userName" className="text-xs font-medium text-slate-800 dark:text-slate-200">
            用户名
          </Label>
          <Input
            id="userName"
            value={form.name || ""}
            onChange={(e) => onChange({ name: e.target.value })}
            className="h-8 rounded-md border-input bg-background text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="userPassword" className="text-xs font-medium text-slate-800 dark:text-slate-200">
            密码
          </Label>
          <Input
            id="userPassword"
            type="text"
            value={form.password || ""}
            onChange={(e) => onChange({ password: e.target.value })}
            placeholder="输入或修改用户密码"
            className="h-8 rounded-md border-input bg-background font-mono text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-800 dark:text-slate-200">
            服务器
          </Label>
          <Select
            value={String(form.server ?? 0)}
            onValueChange={(val) => onChange({ server: Number(val) })}
          >
            <SelectTrigger className="h-8 rounded-md border-input bg-background text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">官服</SelectItem>
              <SelectItem value="1">B服</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="userAgent" className="text-xs font-medium text-slate-800 dark:text-slate-200">
            代理
          </Label>
          <Input
            id="userAgent"
            value={form.agent || ""}
            onChange={(e) => onChange({ agent: e.target.value || null })}
            placeholder="可选"
            className="h-8 rounded-md border-input bg-background text-xs"
          />
        </div>

        <div className="flex items-center space-x-2 pt-1.5">
          <Checkbox
            id="userFreeze"
            checked={Boolean(form.freeze)}
            onCheckedChange={(c) => onChange({ freeze: c ? 1 : 0 })}
          />
          <Label htmlFor="userFreeze" className="text-xs font-medium cursor-pointer text-slate-800 dark:text-slate-200">
            冻结账号
          </Label>
        </div>
      </div>

      {/* 右侧列：账号、任务类型、刷新次数、到期时间（紧凑型 text-xs / h-8） */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="userAccount" className="text-xs font-medium text-slate-800 dark:text-slate-200">
            账号
          </Label>
          <Input
            id="userAccount"
            value={form.account || ""}
            onChange={(e) => onChange({ account: e.target.value })}
            className="h-8 rounded-md border-input bg-background text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-800 dark:text-slate-200">
            任务类型
          </Label>
          <Select
            value={form.taskType || "daily"}
            onValueChange={(val) => onChange({ taskType: val })}
          >
            <SelectTrigger className="h-8 rounded-md border-input bg-background text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">日常任务</SelectItem>
              <SelectItem value="rogue">肉鸽任务</SelectItem>
              <SelectItem value="sand_fire">生息演算</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="userRefresh" className="text-xs font-medium text-slate-800 dark:text-slate-200">
            刷新次数
          </Label>
          <Input
            id="userRefresh"
            type="number"
            min="0"
            value={form.refresh ?? 1}
            onChange={(e) => onChange({ refresh: Number(e.target.value) || 0 })}
            className="h-8 rounded-md border-input bg-background text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="userExpireTime" className="text-xs font-medium text-slate-800 dark:text-slate-200">
            到期时间
          </Label>
          <Input
            id="userExpireTime"
            type="datetime-local"
            value={formatDateForInput(form.expireTime)}
            onChange={(e) => onChange({ expireTime: e.target.value })}
            className="h-8 rounded-md border-input bg-background text-xs"
          />
        </div>
      </div>
    </div>
  )
}

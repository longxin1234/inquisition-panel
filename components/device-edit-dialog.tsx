"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, X, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Device {
  id: number
  deviceName: string
  deviceToken: string
  chinac: number
  region: string | null
  expireTime: string | null
  delete: number
  deviceRole?: "IMPORTANT" | "BACKUP"
}

interface DeviceEditDialogProps {
  device: Device | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (device: { id: number; deviceName: string; delete: number; deviceRole: "IMPORTANT" | "BACKUP" }) => void
}

export function DeviceEditDialog({ device, open, onOpenChange, onSave }: DeviceEditDialogProps) {
  const { toast } = useToast()
  const [editForm, setEditForm] = useState({
    id: 0,
    deviceName: "",
    delete: 0,
    deviceRole: "IMPORTANT" as "IMPORTANT" | "BACKUP",
  })

  useEffect(() => {
    if (device && open) {
      setEditForm({
        id: device.id,
        deviceName: device.deviceName,
        delete: device.delete,
        deviceRole: device.deviceRole === "BACKUP" ? "BACKUP" : "IMPORTANT",
      })
    }
  }, [device, open])

  if (!device) return null

  const handleSave = () => {
    if (!editForm.deviceName.trim()) {
      toast({
        variant: "destructive",
        title: "输入错误",
        description: "设备名称不能为空。",
      })
      return
    }
    onSave(editForm)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <Edit className="h-5 w-5" />
            编辑设备 - {device.deviceName}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">修改设备的名称和状态</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deviceName" className="dark:text-white">
              设备名称
            </Label>
            <Input
              id="deviceName"
              value={editForm.deviceName}
              onChange={(e) => setEditForm({ ...editForm, deviceName: e.target.value })}
              required
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deviceToken" className="dark:text-white">
              设备Token (不可修改)
            </Label>
            <Input
              id="deviceToken"
              value={device.deviceToken}
              readOnly
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deviceRole" className="dark:text-white">
              设备分组
            </Label>
            <Select
              value={editForm.deviceRole}
              onValueChange={(value: "IMPORTANT" | "BACKUP") => setEditForm({ ...editForm, deviceRole: value })}
            >
              <SelectTrigger id="deviceRole" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <SelectValue placeholder="选择设备分组" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IMPORTANT">重点设备</SelectItem>
                <SelectItem value="BACKUP">备用设备</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deleteStatus" className="dark:text-white">
              删除状态
            </Label>
            <Select
              value={editForm.delete.toString()}
              onValueChange={(value) => setEditForm({ ...editForm, delete: Number.parseInt(value) })}
            >
              <SelectTrigger id="deleteStatus" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">正常</SelectItem>
                <SelectItem value="1">已删除</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            取消
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

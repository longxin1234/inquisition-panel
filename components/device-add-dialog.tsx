"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, X, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DeviceAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (device: { deviceName: string; deviceRole: "IMPORTANT" | "BACKUP" }) => void
}

export function DeviceAddDialog({ open, onOpenChange, onSave }: DeviceAddDialogProps) {
  const { toast } = useToast()
  const [deviceName, setDeviceName] = useState("")
  const [deviceRole, setDeviceRole] = useState<"IMPORTANT" | "BACKUP">("BACKUP")

  useEffect(() => {
    if (open) {
      setDeviceName("")
      setDeviceRole("BACKUP")
    }
  }, [open])

  const handleSave = () => {
    if (!deviceName.trim()) {
      toast({
        variant: "destructive",
        title: "输入错误",
        description: "设备名称不能为空。",
      })
      return
    }
    onSave({ deviceName, deviceRole })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <Plus className="h-5 w-5" />
            添加新设备
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">输入新设备的名称</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newDeviceRole" className="dark:text-white">
              设备分组
            </Label>
            <Select value={deviceRole} onValueChange={(value: "IMPORTANT" | "BACKUP") => setDeviceRole(value)}>
              <SelectTrigger id="newDeviceRole" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <SelectValue placeholder="选择设备分组" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IMPORTANT">重点设备</SelectItem>
                <SelectItem value="BACKUP">备用设备</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newDeviceName" className="dark:text-white">
              设备名称
            </Label>
            <Input
              id="newDeviceName"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              required
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            取消
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            添加设备
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

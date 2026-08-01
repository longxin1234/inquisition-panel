export type DeviceRole = "IMPORTANT" | "BACKUP"

export function normalizeDeviceRole(role: unknown): DeviceRole {
  return role === "BACKUP" ? "BACKUP" : "IMPORTANT"
}

export function groupDevicesByRole<T extends { deviceRole?: DeviceRole }>(devices: T[]) {
  return {
    important: devices.filter((device) => normalizeDeviceRole(device.deviceRole) === "IMPORTANT"),
    backup: devices.filter((device) => normalizeDeviceRole(device.deviceRole) === "BACKUP"),
  }
}

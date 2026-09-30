import assert from "node:assert/strict"
import test from "node:test"

import { groupDevicesByRole, normalizeDeviceRole } from "./device-role.ts"

test("normalizes legacy and unknown roles as important devices", () => {
  assert.equal(normalizeDeviceRole("BACKUP"), "BACKUP")
  assert.equal(normalizeDeviceRole("IMPORTANT"), "IMPORTANT")
  assert.equal(normalizeDeviceRole(undefined), "IMPORTANT")
  assert.equal(normalizeDeviceRole("UNKNOWN"), "IMPORTANT")
})

test("groups only explicit backup devices into the backup section", () => {
  const devices = [
    { id: 1, deviceRole: "IMPORTANT" },
    { id: 2, deviceRole: "BACKUP" },
    { id: 3 },
  ]

  const grouped = groupDevicesByRole(devices)

  assert.deepEqual(grouped.important.map((device) => device.id), [1, 3])
  assert.deepEqual(grouped.backup.map((device) => device.id), [2])
})

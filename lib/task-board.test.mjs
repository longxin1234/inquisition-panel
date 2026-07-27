import assert from "node:assert/strict"
import test from "node:test"

import {
  getBoardRefreshInterval,
  getRunningModeLabel,
  getUrgentStatusMeta,
  shouldShowUrgentSection,
  sortRunningTasks,
} from "./task-board.ts"

test("maps every twenty-six urgent state to a visible Chinese label", () => {
  assert.equal(getUrgentStatusMeta("WAITING").label, "等待设备")
  assert.equal(getUrgentStatusMeta("RUNNING").label, "正在登录")
  assert.equal(getUrgentStatusMeta("RETRY_WAIT").label, "重试等待")
  assert.equal(getUrgentStatusMeta("FAILED").label, "等待重试")
  assert.equal(getUrgentStatusMeta("SUCCEEDED").label, "登录成功")
  assert.equal(getUrgentStatusMeta("UNKNOWN").label, "未知状态")
})

test("hides the urgent section and divider when there are no twenty-six urgent tasks", () => {
  assert.equal(shouldShowUrgentSection([]), false)
  assert.equal(shouldShowUrgentSection([{ id: 11 }]), true)
})

test("sorts urgent running assignments first without changing order inside each group", () => {
  const tasks = [
    { assignmentId: "normal-a", urgent: false },
    { assignmentId: "urgent-a", urgent: true },
    { assignmentId: "normal-b", urgent: false },
    { assignmentId: "urgent-b", urgent: true },
  ]

  assert.deepEqual(
    sortRunningTasks(tasks).map((task) => task.assignmentId),
    ["urgent-a", "urgent-b", "normal-a", "normal-b"],
  )
})

test("uses five-second refresh only during the twenty-six to reset window", () => {
  assert.equal(getBoardRefreshInterval(new Date(2026, 6, 28, 1, 59)), 15_000)
  assert.equal(getBoardRefreshInterval(new Date(2026, 6, 28, 2, 0)), 5_000)
  assert.equal(getBoardRefreshInterval(new Date(2026, 6, 28, 3, 59)), 5_000)
  assert.equal(getBoardRefreshInterval(new Date(2026, 6, 28, 4, 0)), 15_000)
})

test("shows the internal login-only assignment separately from normal daily work", () => {
  assert.equal(getRunningModeLabel("LOGIN_ONLY", "daily"), "强制登录")
  assert.equal(getRunningModeLabel("NORMAL", "daily"), "完整日常")
  assert.equal(getRunningModeLabel("NORMAL", "rogue"), "肉鸽")
  assert.equal(getRunningModeLabel("NORMAL", "sand_fire"), "生息演算")
})

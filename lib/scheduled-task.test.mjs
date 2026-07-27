import assert from "node:assert/strict"
import test from "node:test"

import { filterScheduledTasks, formatDuration, getTaskStatusMeta } from "./scheduled-task.ts"

test("maps every backend task state to a visible Chinese label", () => {
  assert.equal(getTaskStatusMeta("HEALTHY").label, "正常")
  assert.equal(getTaskStatusMeta("RUNNING").label, "运行中")
  assert.equal(getTaskStatusMeta("FAILED").label, "执行失败")
  assert.equal(getTaskStatusMeta("MISSED").label, "错过执行")
  assert.equal(getTaskStatusMeta("STALLED").label, "疑似卡住")
  assert.equal(getTaskStatusMeta("WAITING").label, "等待首次运行")
  assert.equal(getTaskStatusMeta("DISABLED").label, "已停用")
  assert.equal(getTaskStatusMeta("UNKNOWN").label, "未知")
})

test("abnormal filter includes failed missed and stalled tasks only", () => {
  const tasks = ["HEALTHY", "RUNNING", "FAILED", "MISSED", "STALLED", "WAITING", "DISABLED"].map(
    (status, index) => ({ key: String(index), status }),
  )

  assert.deepEqual(
    filterScheduledTasks(tasks, "ABNORMAL").map((task) => task.status),
    ["FAILED", "MISSED", "STALLED"],
  )
})

test("formats short and long task durations without unstable precision", () => {
  assert.equal(formatDuration(null), "-")
  assert.equal(formatDuration(850), "850 毫秒")
  assert.equal(formatDuration(12_400), "12.4 秒")
  assert.equal(formatDuration(125_000), "2 分 5 秒")
})

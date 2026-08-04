import assert from "node:assert/strict"
import test from "node:test"

import {
  buildDispatchConfigPayload,
  formatAccountTaskType,
  formatNextScheduledAt,
  getScheduleStatusLabel,
  normalizeScheduleTime,
  normalizeScheduleTimes,
  replaceScheduleTimeAt,
  validateDispatchConfig,
} from "./account-dispatch.ts"
import { getDispatchSourceLabel } from "./task-board.ts"

test("keeps the existing daily task label for automatic dispatch", () => {
  assert.equal(
    formatAccountTaskType({
      taskType: "daily",
      dispatchMode: "AUTO",
      scheduleTimes: [],
      scheduleTime: null,
      scheduleStatus: null,
    }),
    "日常任务",
  )
})

test("formats every scheduled time in the existing task type field", () => {
  assert.equal(
    formatAccountTaskType({
      taskType: "daily",
      dispatchMode: "SCHEDULED",
      scheduleTimes: ["19:30:00", "08:00:00", "14:00"],
      scheduleTime: "08:00:00",
      scheduleStatus: "NORMAL",
    }),
    "定时任务 / 08:00、14:00、19:30 / 正常",
  )
})

test("falls back to the legacy single time when scheduleTimes is absent", () => {
  assert.equal(
    formatAccountTaskType({
      taskType: "daily",
      dispatchMode: "SCHEDULED",
      scheduleTime: "19:30:00",
      scheduleStatus: "NORMAL",
    }),
    "定时任务 / 19:30 / 正常",
  )
})

test("maps every account schedule state to the required Chinese label", () => {
  assert.equal(getScheduleStatusLabel("NOT_RUN"), "未运行")
  assert.equal(getScheduleStatusLabel("WAITING"), "等待中")
  assert.equal(getScheduleStatusLabel("RUNNING"), "运行中")
  assert.equal(getScheduleStatusLabel("RETRY_WAIT"), "重试中")
  assert.equal(getScheduleStatusLabel("NORMAL"), "正常")
  assert.equal(getScheduleStatusLabel("FAILED"), "失败")
})

test("normalizes backend and native-input times to HH:mm", () => {
  assert.equal(normalizeScheduleTime("09:05"), "09:05")
  assert.equal(normalizeScheduleTime("19:30:00"), "19:30")
  assert.equal(normalizeScheduleTime("bad"), "")
  assert.equal(normalizeScheduleTime(null), "")
})

test("formats the persisted next run without changing its server-local time", () => {
  assert.equal(formatNextScheduledAt("2026-07-28T19:30:00"), "07月28日 19:30")
  assert.equal(formatNextScheduledAt("2026-07-28 08:05:00"), "07月28日 08:05")
  assert.equal(formatNextScheduledAt(null), "待调度")
})

test("normalizes, sorts and falls back from the new array to the legacy time", () => {
  assert.deepEqual(normalizeScheduleTimes(["19:30:00", "08:00", "14:00:30"]), [
    "08:00",
    "14:00",
    "19:30",
  ])
  assert.deepEqual(normalizeScheduleTimes(undefined, "19:30:00"), ["19:30"])
  assert.deepEqual(normalizeScheduleTimes([], "08:00:00"), ["08:00"])
})

test("builds a sorted multi-time administrator dispatch update payload", () => {
  assert.deepEqual(buildDispatchConfigPayload("SCHEDULED", ["19:30:00", "08:00", "14:00"]), {
    dispatchMode: "SCHEDULED",
    scheduleTimes: ["08:00", "14:00", "19:30"],
  })
  assert.deepEqual(buildDispatchConfigPayload("AUTO", ["19:30"]), {
    dispatchMode: "AUTO",
  })
})

test("uses the legacy single-time field when only one scheduled time is set", () => {
  assert.deepEqual(buildDispatchConfigPayload("SCHEDULED", ["19:30:00"]), {
    dispatchMode: "SCHEDULED",
    scheduleTime: "19:30",
  })
})

test("updates one schedule field without reordering sibling fields", () => {
  assert.deepEqual(replaceScheduleTimeAt(["21:29", "23:29"], 0, "23:30"), ["23:30", "23:29"])
  assert.deepEqual(replaceScheduleTimeAt(["21:29", "23:29"], 1, "20:15"), ["21:29", "20:15"])
})

test("requires one time and an enabled weekday only for scheduled dispatch", () => {
  assert.deepEqual(validateDispatchConfig("AUTO", [], {}), {})
  assert.deepEqual(validateDispatchConfig("SCHEDULED", [], {}), {
    scheduleTimes: "至少设置 1 个运行时间",
    active: "至少选择一个活跃星期",
  })
  assert.deepEqual(
    validateDispatchConfig("SCHEDULED", ["19:30"], {monday: {enable: true}}),
    {},
  )
})

test("rejects duplicate and invalid scheduled times", () => {
  assert.deepEqual(
    validateDispatchConfig("SCHEDULED", ["08:00", "08:00:00"], {monday: {enable: true}}),
    { scheduleTimes: "运行时间不能重复" },
  )
  assert.deepEqual(
    validateDispatchConfig("SCHEDULED", ["08:00", ""], {monday: {enable: true}}),
    { scheduleTimes: "请填写有效运行时间" },
  )
})

test("rejects more than three scheduled times", () => {
  assert.deepEqual(
    validateDispatchConfig(
      "SCHEDULED",
      ["08:00", "12:00", "16:00", "20:00"],
      {monday: {enable: true}},
    ),
    { scheduleTimes: "最多设置 3 个运行时间" },
  )
})

test("labels high-priority scheduled and manual task sources", () => {
  assert.equal(getDispatchSourceLabel("SCHEDULED"), "定时")
  assert.equal(getDispatchSourceLabel("MANUAL"), "立即上号")
  assert.equal(getDispatchSourceLabel("AUTO"), null)
})

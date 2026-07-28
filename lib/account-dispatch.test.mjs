import assert from "node:assert/strict"
import test from "node:test"

import {
  buildDispatchConfigPayload,
  formatAccountTaskType,
  getScheduleStatusLabel,
  normalizeScheduleTime,
  validateDispatchConfig,
} from "./account-dispatch.ts"
import { getDispatchSourceLabel } from "./task-board.ts"

test("keeps the existing daily task label for automatic dispatch", () => {
  assert.equal(
    formatAccountTaskType({
      taskType: "daily",
      dispatchMode: "AUTO",
      scheduleTime: null,
      scheduleStatus: null,
    }),
    "日常任务",
  )
})

test("formats a scheduled daily account in the existing task type field", () => {
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

test("builds the optional administrator dispatch update payload", () => {
  assert.deepEqual(buildDispatchConfigPayload("SCHEDULED", "19:30:00"), {
    dispatchMode: "SCHEDULED",
    scheduleTime: "19:30",
  })
  assert.deepEqual(buildDispatchConfigPayload("AUTO", "19:30"), {
    dispatchMode: "AUTO",
    scheduleTime: null,
  })
})

test("requires time and an enabled weekday only for scheduled dispatch", () => {
  assert.deepEqual(validateDispatchConfig("AUTO", "", {}), {})
  assert.deepEqual(validateDispatchConfig("SCHEDULED", "", {}), {
    scheduleTime: "请选择运行时间",
    active: "至少选择一个活跃星期",
  })
  assert.deepEqual(
    validateDispatchConfig("SCHEDULED", "19:30", {monday: {enable: true}}),
    {},
  )
})

test("labels high-priority scheduled and manual task sources", () => {
  assert.equal(getDispatchSourceLabel("SCHEDULED"), "定时")
  assert.equal(getDispatchSourceLabel("MANUAL"), "立即上号")
  assert.equal(getDispatchSourceLabel("AUTO"), null)
})

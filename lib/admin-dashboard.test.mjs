import assert from "node:assert/strict"
import test from "node:test"

import {
  clampRate,
  formatDashboardTime,
  parseDeviceState,
  parseLoginFilter,
  parseScheduledTaskFilter,
  parseTaskTab,
  shouldStartDashboardRefresh,
} from "./admin-dashboard.ts"

test("formats dashboard timestamps in Asia Shanghai", () => {
  assert.equal(formatDashboardTime("2026-07-29T14:00:00+08:00"), "07/29 14:00")
  assert.equal(formatDashboardTime("2026-07-29T06:00:00Z"), "07/29 14:00")
  assert.equal(formatDashboardTime(null), "-")
})

test("clamps invalid rates into the visible progress range", () => {
  assert.equal(clampRate(-5), 0)
  assert.equal(clampRate(61.234), 61.2)
  assert.equal(clampRate(120), 100)
  assert.equal(clampRate(Number.NaN), 0)
})

test("accepts only supported dashboard deep-link values", () => {
  assert.equal(parseLoginFilter("missing"), "missing")
  assert.equal(parseLoginFilter("unknown"), "all")
  assert.equal(parseTaskTab("inProgress"), "inProgress")
  assert.equal(parseTaskTab("running"), "pending")
  assert.equal(parseDeviceState("offline"), "offline")
  assert.equal(parseDeviceState("removed"), "all")
  assert.equal(parseScheduledTaskFilter("ABNORMAL"), "ABNORMAL")
  assert.equal(parseScheduledTaskFilter("FAILED"), "ALL")
})

test("never starts a hidden or overlapping dashboard refresh", () => {
  assert.equal(shouldStartDashboardRefresh({ visible: true, inFlight: false }), true)
  assert.equal(shouldStartDashboardRefresh({ visible: true, inFlight: true }), false)
  assert.equal(shouldStartDashboardRefresh({ visible: false, inFlight: false }), false)
})

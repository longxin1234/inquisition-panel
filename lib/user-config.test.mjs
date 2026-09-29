import test from "node:test"
import assert from "node:assert/strict"
import { USER_TASK_GROUPS, reorderTaskGroups, serverLabel, summarizeTaskConfig } from "./user-config.ts"

test("reorders task groups according to the saved order", () => {
  const groups = reorderTaskGroups(USER_TASK_GROUPS, ["schedule", "daily", "resource"])
  assert.deepEqual(groups.map((group) => group.id), ["schedule", "daily", "resource"])
})

test("summarizes enabled daily task switches", () => {
  assert.deepEqual(summarizeTaskConfig({ mail: true, friend: true, credit: false }), { enabled: 2, total: 6 })
})

test("labels official and B servers without exposing credentials", () => {
  assert.equal(serverLabel(0), "官服")
  assert.equal(serverLabel(1), "B服")
})

import test from "node:test"
import assert from "node:assert/strict"
import {
  SCRIPT_TASKS,
  createScriptConfig,
  scriptConfigToAccountConfig,
  summarizeScriptTasks,
} from "./endfield-script-config.ts"

test("mirrors the current script task list without the retired route probe", () => {
  assert.equal(SCRIPT_TASKS.length, 15)
  assert.equal(SCRIPT_TASKS.some((task) => task.id === "route_probe"), false)
  assert.deepEqual(
    SCRIPT_TASKS.filter((task) => task.defaultEnabled).map((task) => task.id),
    ["visit_friends", "simple_crafting", "gear_assembly", "mail_claim", "daily_tasks", "protocol_pass", "event_signin", "shift_rotation"],
  )
})

test("migrates legacy daily switches into script selections", () => {
  const config = createScriptConfig({ daily: { mail: false, friend: true, credit: true, task: false, activity: true } })
  assert.equal(config.selection.mail_claim, false)
  assert.equal(config.selection.visit_friends, true)
  assert.equal(config.selection.credit_shopping, true)
  assert.equal(config.selection.daily_tasks, false)
  assert.equal(config.selection.event_signin, true)
})

test("normalizes script settings and writes dispatcher-compatible aliases", () => {
  const config = createScriptConfig({ script: {
    selection: { material_dispatch: true, stamina_clear: true },
    advancedConfig: {
      material_dispatch: { global_price: 12, moderate_price: 99999 },
      future_setting: { keep_me: true },
    },
  } })
  assert.equal(config.advancedConfig.material_dispatch.global_price, 100)
  assert.equal(config.advancedConfig.material_dispatch.moderate_price, 99999)

  const persisted = scriptConfigToAccountConfig({}, config)
  assert.equal(persisted.script.selection.material_sell, true)
  assert.equal(persisted.script.selection.material_stockpile, true)
  assert.equal(persisted.script.advanced_config.material_dispatch.global_price, 100)
  assert.deepEqual(persisted.script.advanced_config.future_setting, { keep_me: true })
  assert.equal("advancedConfig" in persisted.script, false)
  assert.equal(persisted.daily.mail, true)
  assert.equal(persisted.daily.credit, false)
  assert.deepEqual(summarizeScriptTasks(config.selection), { enabled: 10, total: 15 })
})

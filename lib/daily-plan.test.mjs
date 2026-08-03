import assert from "node:assert/strict"
import test from "node:test"

import { resolveDailyPlan } from "./daily-plan.ts"

test("decodes one escaped Unicode layer in loop-group data", () => {
  const [group] = resolveDailyPlan([
    {
      type: "loop_group",
      loopGroup: {
        name: String.raw`\u5faa\u73af\u4f5c\u6218`,
        items: [{ level: String.raw`\u5173\u5361`, weight: 3 }],
      },
    },
  ])

  assert.deepEqual(group, {
    type: "loop_group",
    loopGroup: {
      name: "\u5faa\u73af\u4f5c\u6218",
      items: [{ level: "\u5173\u5361", weight: 3 }],
    },
  })
})

test("decodes repeated Unicode escaping in loop-group data", () => {
  const [group] = resolveDailyPlan([
    {
      type: "loop_group",
      loopGroup: {
        name: String.raw`\\u5faa\\u73af\\u4f5c\\u6218`,
        items: [{ level: String.raw`\\u5173\\u5361`, weight: 1 }],
      },
    },
  ])

  assert.deepEqual(group, {
    type: "loop_group",
    loopGroup: {
      name: "\u5faa\u73af\u4f5c\u6218",
      items: [{ level: "\u5173\u5361", weight: 1 }],
    },
  })
})

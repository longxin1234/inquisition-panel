import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const editorSource = readFileSync(
  new URL("../components/daily-plan-editor.tsx", import.meta.url),
  "utf8",
)

test("uses decoded JSX labels and placeholders in the daily plan editor", () => {
  assert.doesNotMatch(editorSource, /(?:aria-label|placeholder)="\\u/)
})

test("keeps loop-group inputs full width before the desktop breakpoint", () => {
  assert.match(editorSource, /key=\{`group-\$\{index\}`\}[^>]*className="flex-col[^\"]*sm:flex-row/)
  assert.match(editorSource, /key=\{`group-item-\$\{groupIndex\}`\}[^>]*className="flex-col[^\"]*sm:flex-row/)
})

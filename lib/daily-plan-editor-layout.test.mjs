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

test("keeps the loop-group shell full width and its item controls inline", () => {
  assert.match(editorSource, /key=\{`group-\$\{index\}`\}[^>]*className="flex-col[^\"]*sm:flex-row/)
  assert.match(editorSource, /key=\{`group-item-\$\{groupIndex\}`\}[^>]*className="items-start[^\"]*sm:items-center/)
})

test("keeps mobile task actions on the same row as their inputs", () => {
  assert.match(editorSource, /grid-cols-\[minmax\(0,1fr\)_3\.25rem_auto\]/)
  assert.doesNotMatch(editorSource, /col-span-2 h-9 w-full sm:col-span-1 sm:w-auto/)
})

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const editorSource = readFileSync(
  new URL("../components/account-schedule-editor.tsx", import.meta.url),
  "utf8",
)

test("places the add control after the time fields on their input row", () => {
  assert.match(editorSource, /className="flex flex-wrap items-end gap-3"/)
  assert.match(editorSource, /basis-\[calc\(100%_-_3\.25rem\)\]/)

  const timeFieldsIndex = editorSource.indexOf("scheduleTimes.map")
  const addControlIndex = editorSource.indexOf('aria-label="添加运行时间"')

  assert.ok(timeFieldsIndex >= 0)
  assert.ok(addControlIndex > timeFieldsIndex)
})

test("centers the value inside each native time input", () => {
  assert.match(editorSource, /\[&::-webkit-calendar-picker-indicator\]:opacity-0/)
  assert.match(
    editorSource,
    /className="pointer-events-none absolute inset-y-0 left-1\/2 flex -translate-x-1\/2 items-center/,
  )
  assert.match(editorSource, /\{time \|\| "--:--"\}/)
})

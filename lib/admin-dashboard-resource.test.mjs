import assert from "node:assert/strict"
import test from "node:test"

import { createAdminDashboardResource } from "./admin-dashboard-resource-core.ts"

const overview = (generatedAt) => ({ generatedAt })

test("deduplicates an in-flight dashboard preload and serves the shared cache", async () => {
  let calls = 0
  let release
  const resource = createAdminDashboardResource(() => {
    calls += 1
    return new Promise((resolve) => { release = resolve })
  }, 15_000)

  const first = resource.load("token-a")
  const second = resource.load("token-a")
  assert.equal(calls, 1)

  release(overview("2026-07-29T04:00:00+08:00"))
  assert.deepEqual(await first, await second)
  assert.equal(resource.getCached("token-a")?.generatedAt, "2026-07-29T04:00:00+08:00")

  await resource.load("token-a")
  assert.equal(calls, 1)
})

test("a forced refresh bypasses completed cache but never duplicates the current request", async () => {
  let calls = 0
  const resource = createAdminDashboardResource(async () => overview(`snapshot-${++calls}`), 15_000)

  assert.equal((await resource.load("token-a")).generatedAt, "snapshot-1")
  assert.equal((await resource.load("token-a")).generatedAt, "snapshot-1")
  assert.equal((await resource.load("token-a", { force: true })).generatedAt, "snapshot-2")
  assert.equal(calls, 2)
})

test("expires the reusable cache after fifteen seconds but retains a display snapshot", async () => {
  let calls = 0
  const resource = createAdminDashboardResource(async () => overview(`snapshot-${++calls}`), 15_000)

  await resource.load("token-a")
  assert.equal(resource.getSnapshot("token-a")?.generatedAt, "snapshot-1")
  assert.equal((await resource.load("token-a", { now: Number.MAX_SAFE_INTEGER })).generatedAt, "snapshot-2")
  assert.equal(calls, 2)
})

test("never exposes one administrator token's cached snapshot to another token", async () => {
  let calls = 0
  const resource = createAdminDashboardResource(async () => overview(`snapshot-${++calls}`), 15_000)

  await resource.load("token-a")
  assert.equal(resource.getCached("token-b"), null)
  assert.equal((await resource.load("token-b")).generatedAt, "snapshot-2")
})

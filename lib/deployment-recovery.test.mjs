import assert from "node:assert/strict"
import test from "node:test"

import {
  buildDeploymentRecoveryUrl,
  getDeploymentRecoveryHeaders,
  isRecoverableDeploymentError,
} from "./deployment-recovery.ts"

test("recognizes stale deployment asset failures", () => {
  assert.equal(isRecoverableDeploymentError("ChunkLoadError: Loading chunk 9021 failed"), true)
  assert.equal(isRecoverableDeploymentError("Failed to fetch dynamically imported module"), true)
  assert.equal(isRecoverableDeploymentError("Importing a module script failed"), true)
})

test("does not reload for ordinary application errors", () => {
  assert.equal(isRecoverableDeploymentError("TypeError: Cannot read properties of undefined"), false)
  assert.equal(isRecoverableDeploymentError("用户名或密码错误"), false)
})

test("adds one cache-busting parameter without losing the current location", () => {
  assert.equal(
    buildDeploymentRecoveryUrl("https://longxin.bond/user/dashboard?tab=tasks#today", 1727712000000),
    "https://longxin.bond/user/dashboard?tab=tasks&__deploy_retry=1727712000000#today",
  )
})

test("clears only the HTTP cache on a deployment recovery request", () => {
  assert.deepEqual(
    getDeploymentRecoveryHeaders(new URL("https://longxin.bond/user/dashboard?__deploy_retry=1727712000000")),
    {
      "Cache-Control": "no-store, max-age=0",
      "Clear-Site-Data": '"cache"',
    },
  )
})

test("does not alter normal navigation responses", () => {
  assert.equal(getDeploymentRecoveryHeaders(new URL("https://longxin.bond/user/dashboard")), null)
})

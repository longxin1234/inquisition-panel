import assert from "node:assert/strict"
import test from "node:test"

import {
  DEMO_PASSWORD,
  authenticateDemoAccount,
  getDemoApiResponse,
  isDemoToken,
  isLocalDemoEnvironment,
} from "./demo-mode.ts"

const localDevelopment = { hostname: "localhost", nodeEnv: "development" }

test("demo mode is only available on local development hosts", () => {
  assert.equal(isLocalDemoEnvironment(localDevelopment), true)
  assert.equal(isLocalDemoEnvironment({ hostname: "127.0.0.1", nodeEnv: "development" }), true)
  assert.equal(isLocalDemoEnvironment({ hostname: "endfield-control.example", nodeEnv: "development" }), false)
  assert.equal(isLocalDemoEnvironment({ hostname: "localhost", nodeEnv: "production" }), false)
})

test("the three local demo accounts receive role-scoped tokens", () => {
  const userToken = authenticateDemoAccount("user", "demo-user", DEMO_PASSWORD, localDevelopment)
  const adminToken = authenticateDemoAccount("admin", "demo-admin", DEMO_PASSWORD, localDevelopment)
  const proToken = authenticateDemoAccount("prouser", "demo-pro", DEMO_PASSWORD, localDevelopment)

  assert.ok(userToken)
  assert.ok(adminToken)
  assert.ok(proToken)
  assert.equal(isDemoToken(userToken, "user"), true)
  assert.equal(isDemoToken(adminToken, "admin"), true)
  assert.equal(isDemoToken(proToken, "prouser"), true)
  assert.equal(isDemoToken(userToken, "admin"), false)
})

test("demo authentication rejects wrong credentials and remote hosts", () => {
  assert.equal(authenticateDemoAccount("user", "demo-user", "wrong", localDevelopment), null)
  assert.equal(
    authenticateDemoAccount("user", "demo-user", DEMO_PASSWORD, { hostname: "endfield-control.example", nodeEnv: "development" }),
    null,
  )
})

test("demo user endpoints return complete account data", () => {
  const token = authenticateDemoAccount("user", "demo-user", DEMO_PASSWORD, localDevelopment)
  assert.ok(token)

  const account = getDemoApiResponse("/showMyAccount", token)
  assert.equal(account?.code, 200)
  assert.equal(account?.data.account, "demo-user")
  assert.equal(account?.data.config.daily.infrastructure.harvest, true)
  assert.equal(account?.data.active.monday.enable, true)
})

test("demo admin and agent endpoints return dashboard-ready data", () => {
  const adminToken = authenticateDemoAccount("admin", "demo-admin", DEMO_PASSWORD, localDevelopment)
  const proToken = authenticateDemoAccount("prouser", "demo-pro", DEMO_PASSWORD, localDevelopment)
  assert.ok(adminToken)
  assert.ok(proToken)

  const dashboard = getDemoApiResponse("/getDashboardOverview", adminToken)
  const agent = getDemoApiResponse("/getProUserInfo", proToken)
  const subUsers = getDemoApiResponse("/getSubUserList?type=all&current=1&size=10", proToken)

  assert.equal(dashboard?.data.overallStatus, "WARNING")
  assert.ok(dashboard?.data.devices.items.length > 0)
  assert.equal(typeof agent?.data.balance, "number")
  assert.ok(subUsers?.data.records.length > 0)
})

test("demo write operations stay local and report simulated success", () => {
  const token = authenticateDemoAccount("user", "demo-user", DEMO_PASSWORD, localDevelopment)
  assert.ok(token)

  const response = getDemoApiResponse("/updateMyAccount", token, { method: "POST" })
  assert.deepEqual(response, { code: 200, msg: "演示模式：操作已在本地模拟", data: null })
})

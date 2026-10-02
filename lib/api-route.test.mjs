import assert from "node:assert/strict"
import test from "node:test"

import {
  getApiErrorHttpStatus,
  getApiResultHttpStatus,
  isApiRequestErrorLike,
} from "./api-route-core.ts"

test("uses the legacy JSON error code as the HTTP status", () => {
  assert.equal(getApiResultHttpStatus({ code: 401, msg: "用户名或密码错误" }), 401)
  assert.equal(getApiResultHttpStatus({ code: 400, msg: "用户名或密码不能为空" }), 400)
})

test("keeps successful response codes and falls back for invalid codes", () => {
  assert.equal(getApiResultHttpStatus({ code: 200, msg: "success" }), 200)
  assert.equal(getApiResultHttpStatus({ code: "201", msg: "created" }), 201)
  assert.equal(getApiResultHttpStatus({ code: 0, msg: "unknown" }), 200)
  assert.equal(getApiResultHttpStatus({ code: "not-a-status" }), 200)
})

test("maps upstream request failures to a gateway status", () => {
  const error = Object.assign(new Error("API请求失败: fetch failed"), {
    name: "ApiRequestError",
    status: 504,
    requiresLogin: true,
  })

  assert.equal(isApiRequestErrorLike(error), true)
  assert.equal(getApiErrorHttpStatus(error), 504)
  assert.equal(getApiErrorHttpStatus(new Error("API请求失败: fetch failed")), 502)
  assert.equal(getApiErrorHttpStatus(new Error("unexpected")), 500)
})

import assert from "node:assert/strict"
import test from "node:test"

import { getApiBaseUrl } from "./api-config.ts"

test("getApiBaseUrl uses NEXT_PUBLIC_API_BASE_URL when defined in browser runtime", () => {
  const originalWindow = globalThis.window
  const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL

  try {
    globalThis.window = {}
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.axonnest.com/"

    const baseUrl = getApiBaseUrl("adminLogin")
    assert.equal(baseUrl, "https://api.axonnest.com")

    const subPathUrl = getApiBaseUrl("admin/control/user-logs")
    assert.equal(subPathUrl, "https://api.axonnest.com")
  } finally {
    globalThis.window = originalWindow
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv
    }
  }
})

test("getApiBaseUrl falls back safely to concrete proxy routes when NEXT_PUBLIC_API_BASE_URL is absent in browser", () => {
  const originalWindow = globalThis.window
  const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL

  try {
    globalThis.window = {}
    delete process.env.NEXT_PUBLIC_API_BASE_URL

    assert.equal(getApiBaseUrl("adminLogin"), "/api")
    assert.equal(getApiBaseUrl("showLog"), "/api")
    assert.equal(getApiBaseUrl("admin/control/user-logs"), "/api")
    assert.equal(getApiBaseUrl("unknownLegacyAction"), "/backend-api")
  } finally {
    globalThis.window = originalWindow
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv
    }
  }
})

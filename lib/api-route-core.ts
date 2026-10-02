type ApiResult = {
  code?: unknown
}

function isHttpStatus(value: unknown): value is number {
  const numericValue = typeof value === "string" && value.trim() ? Number(value) : value
  return typeof numericValue === "number" && Number.isInteger(numericValue) && numericValue >= 100 && numericValue <= 599
}

function getErrorProperty(error: unknown, property: string): unknown {
  if (!error || typeof error !== "object") return undefined
  return (error as Record<string, unknown>)[property]
}

export function getApiResultHttpStatus(result: unknown, fallback = 200): number {
  const code = result && typeof result === "object" ? (result as ApiResult).code : undefined
  if (isHttpStatus(code)) return Number(code)
  return fallback
}

export function isApiRequestErrorLike(error: unknown): boolean {
  return getErrorProperty(error, "name") === "ApiRequestError" && isHttpStatus(getErrorProperty(error, "status"))
}

export function getApiErrorHttpStatus(error: unknown): number {
  const status = getErrorProperty(error, "status")
  if (isHttpStatus(status)) return status
  const message = getErrorProperty(error, "message")
  if (typeof message === "string" && /API请求失败|fetch failed|failed to fetch|network|ECONN|ETIMEDOUT/i.test(message)) {
    return 502
  }
  return 500
}

export function getApiErrorMessage(error: unknown, status: number): string {
  const requiresLogin = getErrorProperty(error, "requiresLogin") === true
  if (requiresLogin || status === 401 || status === 403) {
    return "登录已过期或登录状态无法验证，请重新登录"
  }
  if (status === 504) return "上游服务响应超时，请稍后重试"
  if (status === 502) return "上游服务暂时不可用，请稍后重试"

  const message = getErrorProperty(error, "message")
  return typeof message === "string" && message.trim() ? message : "服务器错误"
}

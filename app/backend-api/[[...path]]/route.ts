import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const BACKEND_INTERNAL_URL =
  process.env.BACKEND_API_INTERNAL_URL ||
  process.env.BACKEND_API_URL ||
  "https://endfield-test-api.102818.xyz/backend-api"

async function proxyRequest(
  request: NextRequest,
  context: { params?: Promise<{ path?: string[] }> | { path?: string[] } }
) {
  const resolved = context?.params ? await Promise.resolve(context.params) : undefined
  const pathArray = resolved?.path
  const subPath = Array.isArray(pathArray) ? pathArray.join("/") : (pathArray || "")

  // 安全防御：阻断路径穿越和危险特殊字符
  if (
    subPath.includes("..") ||
    subPath.includes("//") ||
    subPath.startsWith("/") ||
    (pathArray && pathArray.some((seg) => seg === ".." || seg.includes("/") || seg.includes("\\")))
  ) {
    return NextResponse.json({ code: 400, msg: "非法请求路径", data: null }, { status: 400 })
  }

  // 安全防御：拦截敏感开发文档与监控端点，避免暴露内部接口架构
  const lowerSubPath = subPath.toLowerCase()
  if (
    lowerSubPath.includes("swagger") ||
    lowerSubPath.includes("api-docs") ||
    lowerSubPath.includes("druid") ||
    lowerSubPath.includes("actuator")
  ) {
    return NextResponse.json({ code: 404, msg: "接口不存在", data: null }, { status: 404 })
  }

  const url = new URL(request.url)
  const base = BACKEND_INTERNAL_URL.replace(/\/+$/, "")
  const targetUrl = subPath ? `${base}/${subPath}${url.search}` : `${base}${url.search}`

  const forwardHeaders = new Headers()
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (
      lower !== "host" &&
      lower !== "connection" &&
      lower !== "keep-alive" &&
      lower !== "transfer-encoding"
    ) {
      forwardHeaders.set(key, value)
    }
  })

  const init: RequestInit = {
    method: request.method,
    headers: forwardHeaders,
    cache: "no-store",
    redirect: "manual",
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const body = await request.arrayBuffer()
      if (body.byteLength > 0) {
        init.body = body
      }
    } catch {
      // ignore empty body
    }
  }

  try {
    const upstreamResponse = await fetch(targetUrl, init)
    const responseHeaders = new Headers()
    upstreamResponse.headers.forEach((value, key) => {
      const lower = key.toLowerCase()
      if (lower !== "content-encoding" && lower !== "transfer-encoding") {
        responseHeaders.set(key, value)
      }
    })

    // 安全防御：强制声明动态数据无缓存，防止 CDN 节点缓存用户私有数据
    responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    responseHeaders.set("Pragma", "no-cache")
    responseHeaders.set("Expires", "0")

    const bodyBuffer = await upstreamResponse.arrayBuffer()
    return new NextResponse(bodyBuffer, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    })
  } catch (error: any) {
    // 安全防御：服务端仅记录内部错误日志，响应体坚决不泄露上游内部域名、IP 或堆栈信息
    console.error("[Backend-API Proxy Error]:", error?.message || error)
    return NextResponse.json(
      { code: 502, msg: "网关转发超时或上游服务不可达，请稍后重试", data: null },
      { status: 502 }
    )
  }
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const DELETE = proxyRequest
export const PATCH = proxyRequest
export const HEAD = proxyRequest
export const OPTIONS = proxyRequest

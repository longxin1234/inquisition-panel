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
  const subPath = Array.isArray(pathArray) ? pathArray.join("/") : ""

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

    const bodyBuffer = await upstreamResponse.arrayBuffer()
    return new NextResponse(bodyBuffer, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    })
  } catch (error: any) {
    return NextResponse.json(
      { code: 502, msg: `网关代理转发失败: ${error?.message || "网络异常"}`, data: null },
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

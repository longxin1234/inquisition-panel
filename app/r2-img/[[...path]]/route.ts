import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const R2_UPSTREAM =
  process.env.R2_PUBLIC_UPSTREAM_URL ||
  "https://pub-664beb1d38604a24895bb9f97b4d17b3.r2.dev"

export async function GET(
  request: NextRequest,
  context: { params?: Promise<{ path?: string[] }> | { path?: string[] } }
) {
  return handleProxy(request, context, false)
}

export async function HEAD(
  request: NextRequest,
  context: { params?: Promise<{ path?: string[] }> | { path?: string[] } }
) {
  return handleProxy(request, context, true)
}

async function handleProxy(
  request: NextRequest,
  context: { params?: Promise<{ path?: string[] }> | { path?: string[] } },
  isHead: boolean
) {
  const resolved = context?.params ? await Promise.resolve(context.params) : undefined
  const pathArray = resolved?.path
  const subPath = Array.isArray(pathArray) ? pathArray.join("/") : (pathArray || "")

  // 安全校验：阻断路径穿越，只允许合法文件名（字母、数字、点、下划线、短横线）
  if (
    !subPath ||
    subPath.includes("..") ||
    subPath.includes("//") ||
    subPath.startsWith("/") ||
    !/^[a-zA-Z0-9_\-\.\/]+$/.test(subPath)
  ) {
    return new NextResponse("Invalid image path", { status: 400 })
  }

  const base = R2_UPSTREAM.replace(/\/+$/, "")
  const targetUrl = `${base}/${subPath}`

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: isHead ? "HEAD" : "GET",
      headers: {
        "User-Agent": "AxonNest-Edge-Proxy/1.0",
      },
    })

    if (!upstreamRes.ok) {
      return new NextResponse(upstreamRes.statusText, { status: upstreamRes.status })
    }

    const headers = new Headers()
    const contentType = upstreamRes.headers.get("content-type") || "image/png"
    headers.set("Content-Type", contentType)

    if (upstreamRes.headers.has("content-length")) {
      headers.set("Content-Length", upstreamRes.headers.get("content-length")!)
    }
    if (upstreamRes.headers.has("etag")) {
      headers.set("ETag", upstreamRes.headers.get("etag")!)
    }
    if (upstreamRes.headers.has("last-modified")) {
      headers.set("Last-Modified", upstreamRes.headers.get("last-modified")!)
    }

    // 核心加速：注入 30 天公共持久化强缓存头，指导 EdgeOne 节点与浏览器缓存
    headers.set("Cache-Control", "public, max-age=2592000, s-maxage=2592000, immutable")
    headers.set("Access-Control-Allow-Origin", "*")

    if (isHead) {
      return new NextResponse(null, { status: 200, headers })
    }

    return new NextResponse(upstreamRes.body, {
      status: 200,
      headers,
    })
  } catch (error) {
    return new NextResponse("Failed to fetch image from storage", { status: 502 })
  }
}

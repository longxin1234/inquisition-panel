import { type NextRequest, NextResponse } from "next/server"
import { ApiRequestError, apiRequestWithAuth } from "@/lib/api-config"

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("Authorization")
  if (!authorization) {
    return NextResponse.json({ code: 401, msg: "未授权", data: null }, { status: 401 })
  }

  try {
    const token = authorization.replace(/^Bearer\s+/i, "")
    const keyword = new URL(request.url).searchParams.get("keyword") || ""
    const result = await apiRequestWithAuth(
      `/checkCDKByTag?keyword=${encodeURIComponent(keyword)}`,
      token,
      { method: "GET" },
    )
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json(
        { code: error.status, msg: error.message, data: null },
        { status: error.status },
      )
    }
    return NextResponse.json({ code: 502, msg: "CDK 服务暂时不可用，请稍后重试", data: null }, { status: 502 })
  }
}

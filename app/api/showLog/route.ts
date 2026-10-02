import { type NextRequest, NextResponse } from "next/server"
import { apiRequestWithAuth } from "@/lib/api-config"

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("Authorization")
    if (!authorization) {
      return NextResponse.json({ code: 401, msg: "未授权", data: null }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const current = searchParams.get("current") || "1"
    const size = searchParams.get("size") || "10"
    const token = authorization.replace("Bearer ", "")

    const result = await apiRequestWithAuth(`/showLog?current=${current}&size=${size}`, token, {
      method: "GET",
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { code: 500, msg: error.message || "获取日志失败", data: null },
      { status: 500 },
    )
  }
}

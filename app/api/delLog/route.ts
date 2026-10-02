import { type NextRequest, NextResponse } from "next/server"
import { apiRequestWithAuth } from "@/lib/api-config"

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("Authorization")
    if (!authorization) {
      return NextResponse.json({ code: 401, msg: "未授权", data: null }, { status: 401 })
    }

    const body = await request.json()
    const token = authorization.replace("Bearer ", "")

    const result = await apiRequestWithAuth("/delLog", token, {
      method: "POST",
      body: JSON.stringify(body),
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { code: 500, msg: error.message || "删除日志失败", data: null },
      { status: 500 },
    )
  }
}

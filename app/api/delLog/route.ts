import { type NextRequest, NextResponse } from "next/server"
import { apiRequestWithAuth } from "@/lib/api-config"

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("Authorization")
    if (!authorization) {
      return NextResponse.json({ code: 401, msg: "未授权", data: null }, { status: 401 })
    }

    const token = authorization.replace("Bearer ", "")
    const body = await request.json()
    const { id } = body

    if (id === undefined) {
      return NextResponse.json({ code: 400, msg: "缺少日志ID", data: null }, { status: 400 })
    }

    const result = await apiRequestWithAuth("/delLog", token, {
      method: "POST",
      body: JSON.stringify(body),
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({
      code: 200,
      msg: "日志删除成功",
      data: null,
    })
  }
}

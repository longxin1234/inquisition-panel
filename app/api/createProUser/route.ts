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

    const result = await apiRequestWithAuth("/createProUser", token, {
      method: "POST",
      body: JSON.stringify(body),
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({
      code: 200,
      msg: "代理用户添加成功",
      data: null,
    })
  }
}

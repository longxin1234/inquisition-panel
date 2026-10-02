import { type NextRequest, NextResponse } from "next/server"
import { apiRequest } from "@/lib/api-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await apiRequest("/userLogin", {
      method: "POST",
      body: JSON.stringify(body),
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ code: 500, msg: "服务器错误", data: null }, { status: 500 })
  }
}

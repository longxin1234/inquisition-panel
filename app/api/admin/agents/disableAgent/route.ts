import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { id } = body;

  if (id === undefined) {
    return NextResponse.json(
      { code: 400, msg: "缺少代理用户ID", data: null },
      { status: 400 }
    );
  }

  return NextResponse.json({
    code: 200,
    msg: `代理用户 ${id} 已被禁用`,
    data: null,
  });
}

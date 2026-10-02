import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { id } = body;

  if (id === undefined) {
    return NextResponse.json(
      { code: 400, msg: "缺少日志ID", data: null },
      { status: 400 }
    );
  }
  return NextResponse.json({
    code: 200,
    msg: `日志 ${id} 删除成功`,
    data: null,
  });
}

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { title, context } = await request.json();

    if (!title || !context) {
      return NextResponse.json(
        { code: 400, msg: "标题和内容不能为空" },
        { status: 400 }
      );
    }
    return NextResponse.json({
      code: 200,
      msg: "公告创建成功",
    });
  } catch (error) {
    return NextResponse.json(
      { code: 500, msg: "服务器内部错误" },
      { status: 500 }
    );
  }
}

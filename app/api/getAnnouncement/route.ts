import { NextResponse } from "next/server";

export async function GET() {
  const announcementData = {
    context: "欢迎使用！",
    title: "系统公告",
    md5: "fe023a6ab92b2dd82632ea087030c216",
  };

  return NextResponse.json({
    code: 200,
    msg: "获取成功",
    data: announcementData,
  });
}

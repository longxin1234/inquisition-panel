import { NextResponse } from "next/server";
import { apiRequest } from "@/lib/api-config";

export async function GET() {
  try {
    const result = await apiRequest<any>("/getAnnouncement", {
      method: "GET",
    });

    if (result && result.code === 200) {
      const data = result.data || {};
      return NextResponse.json({
        code: 200,
        msg: "获取成功",
        data: {
          title: data.title || "",
          context: data.context || "",
          md5: data.md5 || "",
        },
      });
    }
  } catch {
    // 后端异常或超时时平稳降级
  }

  return NextResponse.json({
    code: 200,
    msg: "获取成功",
    data: {
      title: "",
      context: "",
      md5: "",
    },
  });
}

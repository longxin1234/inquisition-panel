import { NextResponse } from "next/server";

const mockProUsers = Array.from({ length: 50 }).map((_, i) => ({
  id: 1000 + i,
  username: `testpro${String(i + 1).padStart(2, "0")}`,
  password: `hashedpassword${i}`,
  permission: i % 2 === 0 ? "pro" : "root",
  balance: Number.parseFloat((Math.random() * 1000).toFixed(2)),
  discount: Number.parseFloat((Math.random() * 0.5).toFixed(2)),
  authorization: `authkey${String(i + 1).padStart(2, "0")}`,
  expireTime: `2025-07-21T${String(10 + i).padStart(2, "0")}:00:00`,
  delete: i % 5 === 0 ? 1 : 0,
}));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const current = Number.parseInt(searchParams.get("current") || "1");
  const size = Number.parseInt(searchParams.get("size") || "10");
  const username = searchParams.get("username") || "";

  const filteredProUsers = username
    ? mockProUsers.filter((user) => user.username.includes(username))
    : mockProUsers;

  const startIndex = (current - 1) * size;
  const endIndex = startIndex + size;
  const records = filteredProUsers.slice(startIndex, endIndex);

  const total = filteredProUsers.length;
  const page = Math.ceil(total / size);

  return NextResponse.json({
    code: 200,
    msg: "查询成功",
    data: {
      current,
      page,
      total,
      records,
    },
  });
}

import { NextResponse } from "next/server";

const mockProUsers = Array.from({ length: 50 }).map((_, i) => ({
  id: 1000 + i,
  username: `testpro${String(i + 1).padStart(2, "0")}`,
  password: `hashedpassword${i}`,
  permission: i % 2 === 0 ? "pro" : "admin",
  balance: Number.parseFloat((Math.random() * 1000).toFixed(2)),
  discount: Number.parseFloat((Math.random() * 0.5).toFixed(2)),
  authorization: `authkey${String(i + 1).padStart(2, "0")}`,
  expireTime: `2025-07-21T${String(10 + i).padStart(2, "0")}:00:00`,
  delete: i % 5 === 0 ? 1 : 0,
}));

export async function POST(request: Request) {
  const body = await request.json();
  const { id, delete: newDeleteStatus, balance, discount, expireTime } = body;

  if (typeof id !== "number") {
    return NextResponse.json(
      { code: 400, msg: "请求参数无效" },
      { status: 400 }
    );
  }

  const userIndex = mockProUsers.findIndex((user) => user.id === id);

  if (userIndex === -1) {
    return NextResponse.json(
      { code: 404, msg: "未找到该用户" },
      { status: 404 }
    );
  }

  if (typeof newDeleteStatus === "number") {
    mockProUsers[userIndex].delete = newDeleteStatus;
  }
  if (typeof balance === "number") {
    mockProUsers[userIndex].balance = balance;
  }
  if (typeof discount === "number") {
    mockProUsers[userIndex].discount = discount;
  }
  if (typeof expireTime === "string") {
    mockProUsers[userIndex].expireTime = expireTime;
  }

  return NextResponse.json({
    code: 200,
    msg: `用户 ${id} 信息已更新`,
  });
}

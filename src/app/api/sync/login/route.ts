import { NextResponse } from "next/server";
import { createOrVerifyUser, issueToken } from "@/lib/sync-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "username and password required" },
        { status: 400 }
      );
    }

    const user = await createOrVerifyUser(username, password);
    if (!user) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }

    const token = await issueToken(user.id);

    return NextResponse.json({
      token,
      userId: user.id,
      username: user.username,
    });
  } catch (error) {
    console.error("sync login error", error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { env } from "~/env";

export async function POST() {
  // Clear cookie
  const secure = env.NODE_ENV === "production";
  const cookie = `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure ? "; Secure" : ""}`;
  return NextResponse.json({ ok: true }, { status: 200, headers: { "Set-Cookie": cookie } });
}

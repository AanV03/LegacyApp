import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { env } from "~/env";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { identifier?: string; password?: string };

    const identifier = body.identifier?.trim();
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json({ error: "identifier and password required" }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
    });

    if (!user?.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const payload = { userId: user.id, name: user.name, email: user.email };
    const token = jwt.sign(payload, env.AUTH_SECRET ?? "", { expiresIn: "7d" });

    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const secure = env.NODE_ENV === "production";
    const cookie = `token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${
      secure ? "; Secure" : ""
    }`;

    return NextResponse.json({ ok: true, token }, { status: 200, headers: { "Set-Cookie": cookie } });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

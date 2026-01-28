import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "~/server/db";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };

    const email = body.email?.trim();
    const password = body.password;
    const name = body.name?.trim();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "name, email and password are required" }, { status: 400 });
    }

    // Check uniqueness
    const existing = await db.user.findFirst({
      where: { email },
    });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Generate username from email (part before @)
    const username = email.split("@")[0];

    const user = await db.user.create({
      data: {
        username,
        email,
        name,
        password: hashed,
      },
    });

    // Create notifications for admins about the new user
    try {
      const admins = await db.user.findMany({
        where: {
          role: "ADMIN",
        },
      });

      const message = `Nuevo usuario registrado: ${user.name ?? user.email}`;

      await Promise.all(
        admins.map((a) =>
          db.notification.create({
            data: {
              userId: a.id,
              message,
              type: "USER_REGISTERED",
            },
          })
        )
      );
    } catch (err) {
      // Non-fatal: log and continue
      // eslint-disable-next-line no-console
      console.error("Failed to create admin notifications for new user:", err);
    }

    return NextResponse.json({});
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

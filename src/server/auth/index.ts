import { NextResponse } from "next/server";

const handlers = {
	GET: async () => NextResponse.json({ error: "NextAuth removed" }, { status: 404 }),
	POST: async () => NextResponse.json({ error: "NextAuth removed" }, { status: 404 }),
};

export { handlers };

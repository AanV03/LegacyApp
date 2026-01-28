import { type NextRequest, NextResponse } from "next/server";

// Track if cron has been initialized
let cronInitialized = false;

export function middleware(request: NextRequest) {
  // Initialize cron on first request to any API endpoint
  if (!cronInitialized && request.nextUrl.pathname.startsWith("/api")) {
    cronInitialized = true;
    // Trigger the server-side init route via fetch so the work runs in Node runtime
    // Await the fetch and log errors so we can confirm initialization happened
    (async () => {
      try {
        const res = await fetch(new URL("/api/cron/init", request.url).toString(), { method: "GET" });
        if (!res.ok) console.error("[Cron] init route responded with status", res.status);
      } catch (err) {
        console.error("[Cron] failed to call /api/cron/init from middleware:", err);
      }
    })();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};

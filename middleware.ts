import { type NextRequest, NextResponse } from "next/server";

// Track if cron has been initialized
let cronInitialized = false;

export function middleware(request: NextRequest) {
  // Initialize cron on first request to any API endpoint
  if (!cronInitialized && request.nextUrl.pathname.startsWith("/api")) {
    cronInitialized = true;
    // Dynamically import to ensure server-side execution
    void import("~/server/cron/init").then(({ initializeCronJobs }) => {
      void initializeCronJobs();
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};

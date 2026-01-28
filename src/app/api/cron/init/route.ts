import { type NextRequest, NextResponse } from "next/server";
import { initializeCronJobs } from "~/server/cron/init";

// Force this route to run in the Node runtime so it can import Node-only modules (Prisma, node-cron)
export const runtime = "nodejs";

// Global variable to track if cron was already initialized
let cronInitialized = false;

/**
 * Initialize cron jobs on first API call
 * This ensures the server starts processing system events
 */
export async function GET(_req: NextRequest) {
  if (!cronInitialized) {
    cronInitialized = true;
    console.log("[Cron] /api/cron/init called — initializing cron jobs");
    void initializeCronJobs();
  } else {
    console.log("[Cron] /api/cron/init called — already initialized");
  }

  return NextResponse.json({
    status: "ok",
    message: "Cron jobs initialized",
    cronInitialized: true,
  });
}

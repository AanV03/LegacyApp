import { type NextRequest, NextResponse } from "next/server";
import { initializeCronJobs } from "~/server/cron/init";

// Global variable to track if cron was already initialized
let cronInitialized = false;

/**
 * Initialize cron jobs on first API call
 * This ensures the server starts processing system events
 */
export async function GET(_req: NextRequest) {
  if (!cronInitialized) {
    cronInitialized = true;
    void initializeCronJobs();
  }

  return NextResponse.json({
    status: "ok",
    message: "Cron jobs initialized",
    cronInitialized: true,
  });
}

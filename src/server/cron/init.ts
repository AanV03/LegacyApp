import cron from "node-cron";
import { processSystemEvents } from "~/server/cron/processEvents";

let cronJob: ReturnType<typeof cron.schedule> | null = null;

/**
 * Initialize cron jobs
 * Called once at server startup
 */
export function initializeCronJobs() {
  if (cronJob) {
    console.log("[Cron] Cron jobs already initialized");
    return;
  }

  console.log("[Cron] Initializing cron jobs...");

  // Run event processor every 1 minute
  // Pattern: "* * * * *" = every minute
  cronJob = cron.schedule("* * * * *", async () => {
    void processSystemEvents();
  });

  console.log("[Cron] Event processor scheduled to run every minute");
  // Run once immediately so new events are processed without waiting up to 1 minute
  void processSystemEvents();
}

/**
 * Stop all cron jobs
 */
export function stopCronJobs() {
  if (cronJob) {
    void cronJob.stop();
    cronJob = null;
    console.log("[Cron] All cron jobs stopped");
  }
}

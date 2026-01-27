import {
  getUnprocessedEvents,
  markEventsAsProcessed,
  notifyAdminsOfEvent,
} from "~/server/api/services/eventService";
import type { SystemEventType } from "../../../generated/prisma";

/**
 * Process unprocessed system events and notify admins
 * Runs every 1 minute via node-cron
 */
export async function processSystemEvents() {
  try {
    const events = await getUnprocessedEvents();

    if (!events || events.length === 0) {
      console.log("[Cron] No unprocessed events");
      return;
    }

    console.log(`[Cron] Processing ${events.length} events`);

    // Group events by type and user for better notifications
    for (const event of events) {
      try {
        const message = buildEventMessage(event);
        const eventType = event.type satisfies SystemEventType;
        await notifyAdminsOfEvent(eventType, message, {
          userId: event.userId,
          userName: event.userName,
          projectId: event.projectId ?? undefined,
          taskId: event.taskId ?? undefined,
          action: event.action,
          timestamp: event.createdAt,
        });
      } catch (error) {
        console.error(`[Cron] Error processing event ${event.id}:`, error);
      }
    }

    // Mark all events as processed
    const eventIds = events.map((e) => e.id);
    await markEventsAsProcessed(eventIds);
    console.log(`[Cron] Successfully processed ${events.length} events`);
  } catch (error) {
    console.error("[Cron] Error in processSystemEvents:", error);
  }
}

/**
 * Build a human-readable message from system event
 */
function buildEventMessage(event: {
  type: string;
  action: string;
  userName?: string | null;
}): string {
  const user = event.userName ?? "Unknown User";

  switch (event.type) {
    case "PROJECT_CREATED":
      return `[PROYECTO CREADO] ${user} ${event.action}`;
    case "PROJECT_DELETED":
      return `[PROYECTO ELIMINADO] ${user} ${event.action}`;
    case "TASK_CREATED":
      return `[TAREA CREADA] ${user} ${event.action}`;
    case "TASK_UPDATED":
      return `[TAREA ACTUALIZADA] ${user} ${event.action}`;
    case "TASK_DELETED":
      return `[TAREA ELIMINADA] ${user} ${event.action}`;
    case "COMMENT_ADDED":
      return `[COMENTARIO AGREGADO] ${user} ${event.action}`;
    default:
      return `${user} ${event.action}`;
  }
}

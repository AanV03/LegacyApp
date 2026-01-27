import type { SystemEventType, SystemEvent } from "../../../../generated/prisma";
import { db } from "~/server/db";

interface CreateEventInput {
  type: SystemEventType;
  userId: string;
  userName?: string;
  projectId?: number;
  taskId?: number;
  action: string;
  details?: Record<string, unknown>;
}

/**
 * Create a system event for audit trail
 * These events will be processed by cron to notify admins
 */
export async function createSystemEvent(input: CreateEventInput) {
  try {
    await db.systemEvent.create({
      data: {
        type: input.type,
        userId: input.userId,
        userName: input.userName,
        projectId: input.projectId,
        taskId: input.taskId,
        action: input.action,
        details: input.details ? JSON.stringify(input.details) : null,
      },
    });
  } catch (error) {
    console.error("Error creating system event:", error);
    // Don't throw - events are non-critical
  }
}

/**
 * Get unprocessed events for admin notification
 */
export async function getUnprocessedEvents(): Promise<SystemEvent[]> {
  try {
    const events = await db.systemEvent.findMany({
      where: { processed: false },
      orderBy: { createdAt: "asc" },
      take: 100, // Process in batches
    });
    return events;
  } catch (error) {
    console.error("Error fetching unprocessed events:", error);
    return [];
  }
}

/**
 * Mark events as processed
 */
export async function markEventsAsProcessed(eventIds: number[]) {
  if (eventIds.length === 0) return;
  
  try {
    await db.systemEvent.updateMany({
      where: { id: { in: eventIds } },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error marking events as processed:", error);
  }
}

/**
 * Get all admin users
 */
export async function getAdminUsers() {
  try {
    return await db.user.findMany({
      where: {
        role: "ADMIN",
      },
      select: { id: true, email: true, name: true },
    });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return [];
  }
}

/**
 * Create notification for admins
 */
export async function notifyAdminsOfEvent(
  eventType: SystemEventType,
  message: string,
  _details?: Record<string, unknown>
) {
  try {
    const admins = await getAdminUsers();

    if (admins.length === 0) return;

    // Create notifications for all admins
    await db.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        message,
        type:
          eventType === "PROJECT_CREATED"
            ? "PROJECT_CREATED"
            : eventType === "PROJECT_DELETED"
              ? "PROJECT_DELETED"
              : eventType === "TASK_CREATED"
                ? "TASK_CREATED"
                : eventType === "TASK_DELETED"
                  ? "TASK_DELETED"
                  : eventType === "TASK_UPDATED"
                    ? "TASK_STATUS_CHANGED"
                    : "COMMENT_ADDED",
      })),
      skipDuplicates: true,
    });
  } catch (error) {
    console.error("Error notifying admins:", error);
  }
}

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
    const created = await db.systemEvent.create({
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

    // Notify admins immediately so they receive alerts in near real-time
    try {
      await notifyAdminsOfEvent(input.type, input.action, input.details);
      // Mark the system event as processed to avoid double-processing by the cron
      await db.systemEvent.update({ where: { id: created.id }, data: { processed: true, processedAt: new Date() } });
    } catch (notifyErr) {
      console.error("Error notifying admins for system event:", notifyErr);
    }
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
 * Create notification for admins with Spanish translations
 */
export async function notifyAdminsOfEvent(
  eventType: SystemEventType,
  message: string,
  details?: Record<string, unknown>
) {
  try {
    const admins = await getAdminUsers();

    if (admins.length === 0) return;

    const safeString = (value: unknown, fallback = "Sin título"): string => {
      if (typeof value === "string") return value;
      if (typeof value === "number" || typeof value === "boolean") return String(value);
      if (value == null) return fallback;
      if (typeof value === "object") {
        try {
          const s = (value as any)?.toString?.();
          if (s && s !== "[object Object]") return s;
          return JSON.stringify(value);
        } catch {
          return fallback;
        }
      }
      return fallback;
    };

    // Map event types to notification types and generate Spanish messages
    const getNotificationData = (type: SystemEventType) => {
      switch (type) {
        case "PROJECT_CREATED":
          return {
            type: "PROJECT_CREATED" as const,
            displayMessage: `Nuevo proyecto creado: ${safeString(details?.projectName)}`,
          };
        case "PROJECT_DELETED":
          return {
            type: "PROJECT_DELETED" as const,
            displayMessage: `Proyecto eliminado: ${safeString(details?.projectName)}`,
          };
        case "TASK_CREATED":
          return {
            type: "TASK_CREATED" as const,
            displayMessage: `Nueva tarea creada: ${safeString(details?.taskTitle)}`,
          };
        case "TASK_DELETED":
          return {
            type: "TASK_DELETED" as const,
            displayMessage: `Tarea eliminada: ${safeString(details?.taskTitle)}`,
          };
        case "TASK_UPDATED":
          return {
            type: "TASK_STATUS_CHANGED" as const,
            displayMessage: `Tarea actualizada: ${safeString(details?.taskTitle)}`,
          };
        case "COMMENT_ADDED":
          return {
            type: "COMMENT_ADDED" as const,
            displayMessage: `Nuevo comentario en: ${safeString(details?.taskTitle, "una tarea")}`,
          };
        default:
          return {
            type: "COMMENT_ADDED" as const,
            displayMessage: message,
          };
      }
    };

    const notifData = getNotificationData(eventType);

    // Create notifications for all admins
    await db.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        message: notifData.displayMessage,
        type: notifData.type,
      })),
      skipDuplicates: true,
    });
  } catch (error) {
    console.error("Error notifying admins:", error);
  }
}

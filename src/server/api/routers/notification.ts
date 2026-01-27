import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

// ============================================================================
// ROUTER
// ============================================================================

export const notificationRouter = createTRPCRouter({
  /**
   * Get all unread notifications for current user
   */
  getUnread: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await ctx.db.notification.findMany({
      where: {
        userId: ctx.session.user.id,
        read: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return notifications;
  }),

  /**
   * Get all notifications for current user
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const notifications = await ctx.db.notification.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
      });

      return notifications;
    }),

  /**
   * Mark a specific notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.findUnique({
        where: { id: input.id },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      if (notification.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own notifications",
        });
      }

      const updated = await ctx.db.notification.update({
        where: { id: input.id },
        data: {
          read: true,
        },
      });

      return updated;
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await ctx.db.notification.updateMany({
      where: {
        userId: ctx.session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return {
      updated: result.count,
      message: `${result.count} notifications marked as read`,
    };
  }),

  /**
   * Delete a notification
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.findUnique({
        where: { id: input.id },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      if (notification.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own notifications",
        });
      }

      const deleted = await ctx.db.notification.delete({
        where: { id: input.id },
      });

      return {
        id: deleted.id,
        message: "Notification deleted successfully",
      };
    }),

  /**
   * Get unread count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.notification.count({
      where: {
        userId: ctx.session.user.id,
        read: false,
      },
    });

    return { unreadCount: count };
  }),

  /**
   * Get notifications grouped by type
   */
  getByType: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await ctx.db.notification.findMany({
      where: {
        userId: ctx.session.user.id,
      },
    });

    const byType: Record<string, typeof notifications> = {};
    for (const notif of notifications) {
      byType[notif.type] ??= [];
      byType[notif.type]!.push(notif);
    }

    return byType;
  }),
});

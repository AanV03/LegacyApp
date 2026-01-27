import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

// ============================================================================
// ROUTER
// ============================================================================

export const historyRouter = createTRPCRouter({
  /**
   * Get history for a specific task
   */
  getByTask: protectedProcedure
    .input(z.object({ taskId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.taskId },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      const history = await ctx.db.history.findMany({
        where: {
          taskId: input.taskId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          timestamp: "asc",
        },
      });

      return history;
    }),

  /**
   * Get all history entries for the current user
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const history = await ctx.db.history.findMany({
        where: {
          user: {
            id: ctx.session.user.id,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: input.limit,
      });

      return history;
    }),

  /**
   * Get history for a specific user and task
   */
  getByUserAndTask: protectedProcedure
    .input(
      z.object({
        taskId: z.number().int().positive(),
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const history = await ctx.db.history.findMany({
        where: {
          taskId: input.taskId,
          userId: input.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          timestamp: "asc",
        },
      });

      return history;
    }),

  /**
   * Get activity summary
   */
  getActivitySummary: protectedProcedure.query(async ({ ctx }) => {
    const history = await ctx.db.history.findMany({
      where: {
        user: {
          id: ctx.session.user.id,
        },
      },
    });

    const summary: Record<string, number> = {};
    for (const entry of history) {
      summary[entry.action] = (summary[entry.action] ?? 0) + 1;
    }

    return {
      total: history.length,
      byAction: summary,
      lastActivity: history[history.length - 1]?.timestamp ?? null,
    };
  }),
});

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { createSystemEvent } from "~/server/api/services/eventService";

// ============================================================================
// SCHEMAS
// ============================================================================

const CreateCommentSchema = z.object({
  taskId: z.number().int().positive("Task ID is required"),
  text: z.string().min(1, "Comment cannot be empty").max(5000),
});

// ============================================================================
// ROUTER
// ============================================================================

export const commentRouter = createTRPCRouter({
  /**
   * Get all comments for a specific task
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

      const comments = await ctx.db.comment.findMany({
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
              assignedToId: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return comments;
    }),

  /**
   * Create a new comment on a task
   * Automatically creates Notification for task assignee
   */
  create: protectedProcedure
    .input(CreateCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
      return await ctx.db.$transaction(async (tx: any) => {
        // Prisma transaction callback requires 'any' type - unable to properly type without major refactoring
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const task = await tx.task.findUnique({
          where: { id: input.taskId },
          include: {
            assignedTo: true,
          },
        });

        if (!task) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const comment = await tx.comment.create({
          data: {
            text: input.text,
            taskId: input.taskId,
            userId: ctx.session.user.id,
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
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (task.assignedToId && task.assignedToId !== ctx.session.user.id) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          const userId: string = task.assignedToId;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          await tx.notification.create({
            data: {
              userId,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              message: `New comment on task: ${task.title}`,
              type: "COMMENT_ADDED",
            },
          });
        }

        // Create system event for audit
        const taskTitle = (task as Record<string, unknown>).title;
        void createSystemEvent({
          type: "COMMENT_ADDED",
          userId: ctx.session.user.id,
          userName: ctx.session.user.name ?? ctx.session.user.email ?? "Unknown",
          taskId: input.taskId,
          action: `Added comment to task: ${String(taskTitle)}`,
          details: {
            comment: input.text.substring(0, 100),
            taskTitle: String(taskTitle),
          },
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return comment;
      });
    }),

  /**
   * Delete a comment
   * Only the comment author or task creator can delete
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({
        where: { id: input.id },
        include: {
          task: {
            select: {
              createdById: true,
            },
          },
        },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      const isCommentAuthor = comment.userId === ctx.session.user.id;
      const isTaskCreator = comment.task.createdById === ctx.session.user.id;

      if (!isCommentAuthor && !isTaskCreator) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own comments or comments on your tasks",
        });
      }

      const deletedComment = await ctx.db.comment.delete({
        where: { id: input.id },
      });

      return {
        id: deletedComment.id,
        message: "Comment deleted successfully",
      };
    }),

  /**
   * Get all comments for the current user
   */
  getByUser: protectedProcedure.query(async ({ ctx }) => {
    const comments = await ctx.db.comment.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return comments;
  }),
});

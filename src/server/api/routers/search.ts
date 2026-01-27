import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { Prisma as PrismaTypes, TaskStatus as TaskStatusType, TaskPriority as TaskPriorityType } from "../../../../generated/prisma";

// ============================================================================
// SCHEMAS
// ============================================================================

const SearchTasksSchema = z.object({
  text: z.string().max(500).optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  projectId: z.string().optional(),
  assignedOnly: z.boolean().optional(),
});

// ============================================================================
// ROUTER
// ============================================================================

export const searchRouter = createTRPCRouter({
  /**
   * Search tasks with advanced filters
   */
  tasks: protectedProcedure
    .input(SearchTasksSchema)
    .query(async ({ ctx, input }) => {
      const whereConditions: PrismaTypes.TaskWhereInput = {
        createdBy: {
          id: String(ctx.session.user.id),
        },
      };

      if (input.text?.trim()) {
        whereConditions.OR = [
          { title: { contains: input.text, mode: "insensitive" } },
          { description: { contains: input.text, mode: "insensitive" } },
        ];
      }

      if (input.status && input.status !== "all") {
        whereConditions.status = input.status as unknown as TaskStatusType;
      }

      if (input.priority && input.priority !== "all") {
        whereConditions.priority = input.priority as unknown as TaskPriorityType;
      }

      if (input.projectId && input.projectId !== "all") {
        whereConditions.projectId = parseInt(input.projectId);
      }

      if (input.assignedOnly) {
        whereConditions.assignedToId = { not: null } as unknown as PrismaTypes.StringFilter;
      }

      const tasks = await ctx.db.task.findMany({
        where: whereConditions,
        include: {
          project: true,
          assignedTo: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return tasks;
    }),

  /**
   * Advanced search with pagination
   */
  tasksWithPagination: protectedProcedure
    .input(
      SearchTasksSchema.extend({
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereConditions: PrismaTypes.TaskWhereInput = {
        createdBy: {
          id: String(ctx.session.user.id),
        },
      };

      if (input.text?.trim()) {
        whereConditions.OR = [
          { title: { contains: input.text, mode: "insensitive" } },
          { description: { contains: input.text, mode: "insensitive" } },
        ];
      }

      if (input.status && input.status !== "all") {
        whereConditions.status = input.status as unknown as TaskStatusType;
      }

      if (input.priority && input.priority !== "all") {
        whereConditions.priority = input.priority as unknown as TaskPriorityType;
      }

      if (input.projectId && input.projectId !== "all") {
        whereConditions.projectId = parseInt(input.projectId);
      }

      if (input.assignedOnly) {
        whereConditions.assignedToId = { not: null } as unknown as PrismaTypes.StringFilter;
      }

      const skip = (input.page - 1) * input.pageSize;

      const [tasks, total] = await Promise.all([
        ctx.db.task.findMany({
          where: whereConditions,
          include: {
            project: true,
            assignedTo: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: input.pageSize,
        }),
        ctx.db.task.count({ where: whereConditions }),
      ]);

      const totalPages = Math.ceil(total / input.pageSize);

      return {
        tasks,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total,
          totalPages,
          hasNextPage: input.page < totalPages,
          hasPreviousPage: input.page > 1,
        },
      };
    }),

  /**
   * Search projects
   */
  projects: protectedProcedure
    .input(
      z.object({
        text: z.string().max(500).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereConditions: PrismaTypes.ProjectWhereInput = {
        createdById: String(ctx.session.user.id),
      };

      if (input.text?.trim()) {
        whereConditions.OR = [
          { name: { contains: input.text, mode: "insensitive" } },
          { description: { contains: input.text, mode: "insensitive" } },
        ];
      }

      const projects = await ctx.db.project.findMany({
        where: whereConditions,
        include: {
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return projects;
    }),

  /**
   * Get tasks by status
   */
    tasksByStatus: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await ctx.db.task.findMany({
      where: {
        createdBy: {
          id: String(ctx.session.user.id),
        },
      },
      select: {
        status: true,
      },
    });

    const byStatus = tasks.reduce((acc, task) => {
      const key = String(task.status ?? "");
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return byStatus;
  }),

  /**
   * Get tasks by priority
   */
    tasksByPriority: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await ctx.db.task.findMany({
      where: {
        createdBy: {
          id: String(ctx.session.user.id),
        },
      },
      select: {
        priority: true,
      },
    });

    const byPriority = tasks.reduce((acc, task) => {
      const key = String(task.priority ?? "");
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return byPriority;
  }),

  /**
   * Get assigned tasks
   */
  myAssignedTasks: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await ctx.db.task.findMany({
      where: {
        assignedToId: String(ctx.session.user.id),
      },
      include: {
        project: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return tasks;
  }),
});

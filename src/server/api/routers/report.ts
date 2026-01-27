import { z } from "zod";
// Local lightweight type for `where` conditions to avoid depending on generated Prisma input types
type TaskWhereInput = {
  createdBy?: { id: string };
  status?: string;
  priority?: string;
  projectId?: number;
  assignedToId?: string;
  project?: { createdById?: string };
  createdById?: string;
  OR?: TaskWhereInput[];
};
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// ============================================================================
// SCHEMAS
// ============================================================================

const DateRangeSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

// ============================================================================
// ROUTER
// ============================================================================

export const reportRouter = createTRPCRouter({
  /**
   * Get task breakdown by status
   */
  tasksByStatus: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await ctx.db.task.findMany({
      where: {
        createdBy: {
          id: ctx.session.user.id,
        },
      },
      select: {
        status: true,
      },
    });

    const summary: Record<string, number> = {};
    for (const task of tasks) {
      summary[task.status] = (summary[task.status] ?? 0) + 1;
    }

    return {
      type: "STATUS",
      data: summary,
      timestamp: new Date(),
    };
  }),

  /**
   * Get task breakdown by priority
   */
  tasksByPriority: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await ctx.db.task.findMany({
      where: {
        createdBy: {
          id: ctx.session.user.id,
        },
      },
      select: {
        priority: true,
      },
    });

    const summary: Record<string, number> = {};
    for (const task of tasks) {
      summary[task.priority] = (summary[task.priority] ?? 0) + 1;
    }

    return {
      type: "PRIORITY",
      data: summary,
      timestamp: new Date(),
    };
  }),

  /**
   * Get task breakdown by project
   */
  tasksByProject: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await ctx.db.task.findMany({
      where: {
        createdBy: {
          id: ctx.session.user.id,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const summary: Record<string, number> = {};
    for (const task of tasks) {
      const projectName = task.project?.name ?? "No Project";
      summary[projectName] = (summary[projectName] ?? 0) + 1;
    }

    return {
      type: "PROJECT",
      data: summary,
      timestamp: new Date(),
    };
  }),

  /**
   * Get task breakdown by assignee
   */
  tasksByAssignee: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await ctx.db.task.findMany({
      where: {
        createdBy: {
          id: ctx.session.user.id,
        },
      },
      include: {
        assignedTo: {
          select: {
            username: true,
            name: true,
          },
        },
      },
    });

    const summary: Record<string, number> = {};
    for (const task of tasks) {
      const assigneeName = task.assignedTo?.name ?? "Unassigned";
      summary[assigneeName] = (summary[assigneeName] ?? 0) + 1;
    }

    return {
      type: "ASSIGNEE",
      data: summary,
      timestamp: new Date(),
    };
  }),

  /**
   * Get comprehensive report summary
   */
  summary: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await ctx.db.task.findMany({
      where: {
        createdBy: {
          id: ctx.session.user.id,
        },
      },
      include: {
        project: true,
        assignedTo: true,
      },
    });

    const completed = tasks.filter((t) => t.status === "COMPLETED").length;
    const total = tasks.length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    const statusBreakdown: Record<string, number> = {};
    for (const task of tasks) {
      statusBreakdown[task.status] = (statusBreakdown[task.status] ?? 0) + 1;
    }

    const priorityBreakdown: Record<string, number> = {};
    for (const task of tasks) {
      priorityBreakdown[task.priority] = (priorityBreakdown[task.priority] ?? 0) + 1;
    }

    const projectBreakdown: Record<string, number> = {};
    for (const task of tasks) {
      const projectName = task.project?.name ?? "No Project";
      projectBreakdown[projectName] = (projectBreakdown[projectName] ?? 0) + 1;
    }

    const assignedCount = tasks.filter((t) => t.assignedToId).length;
    const unassignedCount = total - assignedCount;

    return {
      total,
      completed,
      pending: total - completed,
      completionRate,
      assigned: assignedCount,
      unassigned: unassignedCount,
      byStatus: statusBreakdown,
      byPriority: priorityBreakdown,
      byProject: projectBreakdown,
      generatedAt: new Date(),
    };
  }),

  /**
   * Export tasks as CSV
   */
  exportTasksAsCSV: protectedProcedure
    .input(
      z.object({
        filters: z
          .object({
            status: z.string().optional(),
            priority: z.string().optional(),
            projectId: z.string().optional(),
            assignedToId: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const whereConditions: TaskWhereInput = {
        createdBy: {
          id: ctx.session.user.id,
        },
      };

      if (input.filters?.status && input.filters.status !== "all") {
        whereConditions.status = input.filters.status;
      }

      if (input.filters?.priority && input.filters.priority !== "all") {
        whereConditions.priority = input.filters.priority;
      }

      if (input.filters?.projectId && input.filters.projectId !== "all") {
        whereConditions.projectId = parseInt(input.filters.projectId);
      }

      if (input.filters?.assignedToId && input.filters.assignedToId !== "all") {
        whereConditions.assignedToId = input.filters.assignedToId;
      }

      const tasks = await ctx.db.task.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        where: whereConditions as any,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          projectId: true,
          assignedToId: true,
          createdAt: true,
          updatedAt: true,
          dueDate: true,
          project: {
            select: {
              name: true,
            },
          },
          assignedTo: {
            select: {
              name: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Build CSV
      const headers = [
        "ID",
        "Title",
        "Description",
        "Status",
        "Priority",
        "Project",
        "Assigned To",
        "Created At",
        "Updated At",
        "Due Date",
      ];

      const rows = tasks.map((task) => [
        task.id,
        `"${task.title.replace(/"/g, '""') }"`,
        `"${(task.description ?? "").replace(/"/g, '""') }"`,
        task.status,
        task.priority,
        task.project?.name ?? "N/A",
        task.assignedTo?.name ?? "Unassigned",
        task.createdAt.toISOString(),
        task.updatedAt.toISOString(),
        task.dueDate ? task.dueDate.toISOString() : "N/A",
      ]);

      const csv =
        [headers.join(","), ...rows.map((r) => r.join(","))].join("\n") +
        "\n";

      return {
        csv,
        filename: `tasks-export-${new Date().toISOString().split("T")[0]}.csv`,
        count: tasks.length,
      };
    }),

  /**
   * Get overdue task report
   */
  overdueReport: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();

    const overdueTasks = await ctx.db.task.findMany({
      where: {
        createdBy: {
          id: ctx.session.user.id,
        },
        dueDate: {
          lt: now,
        },
        status: {
          not: "COMPLETED",
        },
      },
      include: {
        project: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    const byPriority: Record<string, number> = {};
    for (const task of overdueTasks) {
      byPriority[task.priority] = (byPriority[task.priority] ?? 0) + 1;
    }

    const byProject: Record<string, number> = {};
    for (const task of overdueTasks) {
      const projectName = task.project?.name ?? "No Project";
      byProject[projectName] = (byProject[projectName] ?? 0) + 1;
    }

    return {
      total: overdueTasks.length,
      tasks: overdueTasks,
      byPriority,
      byProject,
      reportDate: new Date(),
    };
  }),

  /**
   * Get productivity report
   */
  productivityReport: protectedProcedure
    .input(DateRangeSchema)
    .query(async ({ ctx, input }) => {
      const startDate = input.startDate ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = input.endDate ?? new Date();

      const completedTasks = await ctx.db.task.findMany({
        where: {
          createdBy: {
            id: ctx.session.user.id,
          },
          status: "COMPLETED",
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          project: true,
        },
      });

      const taskHistory = await ctx.db.history.findMany({
        where: {
          userId: ctx.session.user.id,
          action: "STATUS_CHANGED",
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const byProject: Record<string, number> = {};
      for (const task of completedTasks) {
        const projectName = task.project?.name ?? "No Project";
        byProject[projectName] = (byProject[projectName] ?? 0) + 1;
      }

      // Calculate daily productivity
      const dailyStats: Record<string, number> = {};
      for (const task of completedTasks) {
        const date = task.updatedAt.toISOString().split("T")[0] ?? "unknown";
        dailyStats[date] = (dailyStats[date] ?? 0) + 1;
      }

      const avgTasksPerDay =
        completedTasks.length > 0
          ? (completedTasks.length / Math.max(Object.keys(dailyStats).length, 1)).toFixed(2)
          : "0";

      return {
        period: {
          startDate,
          endDate,
        },
        totalCompleted: completedTasks.length,
        totalStatusChanges: taskHistory.length,
        avgTasksPerDay: parseFloat(avgTasksPerDay),
        byProject,
        dailyStats,
        reportDate: new Date(),
      };
    }),

  /**
   * Get tasks by status with detailed information (for tab view)
   */
  tasksByStatusDetailed: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const whereConditions: TaskWhereInput = {
        createdBy: {
          id: ctx.session.user.id,
        },
      };

      if (input.status && input.status !== "all") {
        whereConditions.status = input.status;
      }

      const tasks = await ctx.db.task.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        where: whereConditions as any,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              name: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const count = tasks.length;

      return {
        tasks,
        count,
        statuses: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      };
    }),

  /**
   * Get tasks by priority with detailed information (for tab view)
   */
  tasksByPriorityDetailed: protectedProcedure
    .input(z.object({ priority: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const whereConditions: TaskWhereInput = {
        createdBy: {
          id: ctx.session.user.id,
        },
      };

      if (input.priority && input.priority !== "all") {
        whereConditions.priority = input.priority;
      }

      const tasks = await ctx.db.task.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        where: whereConditions as any,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              name: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const count = tasks.length;

      return {
        tasks,
        count,
        priorities: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      };
    }),

  /**
   * Get list of projects for current user
   */
  projectsList: protectedProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany({
      where: {
        createdById: ctx.session.user.id,
      },
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

    return {
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        taskCount: p._count.tasks,
        createdAt: p.createdAt,
      })),
    };
  }),

  /**
   * Get overview stats for a specific project
   */
  projectOverview: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          createdById: ctx.session.user.id,
        },
        include: {
          tasks: true,
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      const tasks = project.tasks;
      const completed = tasks.filter((t) => t.status === "COMPLETED").length;
      const overdue = tasks.filter(
        (t) => t.dueDate && t.dueDate < new Date() && t.status !== "COMPLETED"
      ).length;

      const byStatus: Record<string, number> = {};
      const byPriority: Record<string, number> = {};

      for (const task of tasks) {
        byStatus[task.status] = (byStatus[task.status] ?? 0) + 1;
        byPriority[task.priority] = (byPriority[task.priority] ?? 0) + 1;
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        total: tasks.length,
        completed,
        pending: tasks.length - completed,
        overdue,
        completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
        byStatus,
        byPriority,
      };
    }),

  /**
   * Get tasks for a specific project with optional filters
   */
  tasksForProject: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        status: z.string().optional(),
        priority: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereConditions: TaskWhereInput = {
        projectId: input.projectId,
        project: {
          createdById: ctx.session.user.id,
        },
      };

      if (input.status && input.status !== "all") {
        whereConditions.status = input.status;
      }
      if (input.priority && input.priority !== "all") {
        whereConditions.priority = input.priority;
      }

      const tasks = await ctx.db.task.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        where: whereConditions as any,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          dueDate: "asc",
        },
      });

      return {
        tasks,
        count: tasks.length,
      };
    }),

  /**
   * Get list of users (team members)
   */
  userList: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      where: {
        // Get all users that have tasks assigned to them or created by them in the same projects as current user
        // For simplicity, return all users
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      users,
    };
  }),

  /**
   * Get overview stats for a specific user
   */
  userOverview: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      // If requesting the current user's report, include tasks they created OR tasks assigned to them.
      // For other users, keep the previous behavior: show tasks assigned to that user within the
      // scope of tasks created by the session user.
      let where: TaskWhereInput;
      if (input.userId === ctx.session.user.id) {
        where = {
          OR: [{ assignedToId: input.userId }, { createdById: ctx.session.user.id }],
        };
      } else {
        where = { assignedToId: input.userId, createdBy: { id: ctx.session.user.id } };
      }

      const assignedTasks = await ctx.db.task.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        where: where as any,
        include: {
          project: {
            select: {
              name: true,
            },
          },
        },
      });

      const completed = assignedTasks.filter((t) => t.status === "COMPLETED").length;
      const overdue = assignedTasks.filter(
        (t) => t.dueDate && t.dueDate < new Date() && t.status !== "COMPLETED"
      ).length;

      const byStatus: Record<string, number> = {};
      const byPriority: Record<string, number> = {};

      for (const task of assignedTasks) {
        byStatus[task.status] = (byStatus[task.status] ?? 0) + 1;
        byPriority[task.priority] = (byPriority[task.priority] ?? 0) + 1;
      }

      // Calculate average resolution time (only for completed tasks with timestamps)
      const completedWithDates = assignedTasks.filter(
        (t) => t.status === "COMPLETED" && t.updatedAt && t.createdAt
      );
      const avgResolutionTime =
        completedWithDates.length > 0
          ? completedWithDates.reduce((sum, t) => {
              const diff = t.updatedAt.getTime() - t.createdAt.getTime();
              return sum + diff;
            }, 0) / completedWithDates.length
          : 0;

      return {
        userId: input.userId,
        totalAssigned: assignedTasks.length,
        completed,
        pending: assignedTasks.length - completed,
        overdue,
        completionRate: assignedTasks.length > 0 ? Math.round((completed / assignedTasks.length) * 100) : 0,
        avgResolutionTimeHours: Math.round(avgResolutionTime / (1000 * 60 * 60)),
        byStatus,
        byPriority,
      };
    }),

  /**
   * Get tasks assigned to a specific user with optional filters
   */
  tasksForUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        status: z.string().optional(),
        priority: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {

      // If requesting own tasks, include both tasks assigned to the user and tasks they created.
      // For other users, return tasks assigned to that user but only within creators scope.
      let whereConditions: TaskWhereInput;
      if (input.userId === ctx.session.user.id) {
        whereConditions = {
          OR: [{ assignedToId: input.userId }, { createdById: ctx.session.user.id }],
        };
      } else {
        whereConditions = { assignedToId: input.userId, createdBy: { id: ctx.session.user.id } };
      }

      if (input.status && input.status !== "all") {
        whereConditions.status = input.status;
      }
      if (input.priority && input.priority !== "all") {
        whereConditions.priority = input.priority;
      }

      const tasks = await ctx.db.task.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        where: whereConditions as any,
        include: {
          project: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          dueDate: "asc",
        },
      });

      return {
        tasks,
        count: tasks.length,
      };
    }),
});

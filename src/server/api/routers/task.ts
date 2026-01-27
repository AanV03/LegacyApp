import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { createSystemEvent } from "~/server/api/services/eventService";
import { TaskStatus as TaskStatusEnum, TaskPriority as TaskPriorityEnum } from "../../../../generated/prisma";
import type {
  Prisma as PrismaTypes,
  Task,
  HistoryAction,
  NotificationType,
  TaskStatus as TaskStatusType,
  TaskPriority as TaskPriorityType,
} from "../../../../generated/prisma";
import { type createTRPCContext } from "~/server/api/trpc";

  type Context = Awaited<ReturnType<typeof createTRPCContext>>;

  type MinimalTask = Partial<Pick<Task, "id" | "title" | "status" | "priority" | "assignedToId" | "dueDate" | "createdById">> & {
    dueDate?: Date | string | null;
  };

  const TaskStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
  const TaskPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

  const HistoryActions = {
    CREATED: "CREATED",
    STATUS_CHANGED: "STATUS_CHANGED",
    TITLE_CHANGED: "TITLE_CHANGED",
    PRIORITY_CHANGED: "PRIORITY_CHANGED",
    ASSIGNED: "ASSIGNED",
    DUE_DATE_CHANGED: "DUE_DATE_CHANGED",
    DELETED: "DELETED",
  } as const;

  const NotificationTypes = {
    TASK_ASSIGNED: "TASK_ASSIGNED",
    TASK_COMPLETED: "TASK_COMPLETED",
    COMMENT_ADDED: "COMMENT_ADDED",
  } as const;

  // SCHEMAS
  const CreateTaskSchema = z.object({
    title: z.string().min(1, "Task title is required").max(500),
    description: z.string().max(2000).optional(),
    status: z.nativeEnum(TaskStatusEnum).default(TaskStatusEnum.PENDING),
    priority: z.nativeEnum(TaskPriorityEnum).default(TaskPriorityEnum.MEDIUM),
    projectId: z.number().int().positive("Select a project"),
    assignedToId: z.string().optional(),
    dueDate: z.date().optional(),
    estimatedHours: z.number().nonnegative("Hours must be >= 0").default(0),
  });

  const UpdateTaskSchema = CreateTaskSchema.extend({
    id: z.number().int().positive("Invalid task ID"),
    actualHours: z.number().nonnegative().optional(),
  });

  const SearchTasksSchema = z.object({
    text: z.string().max(500).optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    projectId: z.string().optional(),
  });

  // HELPERS
  async function createHistoryEntries(
    ctx: Context,
    taskId: number,
    userId: string,
    oldTask: MinimalTask,
    newTask: MinimalTask
  ) {
    const entries: Array<PrismaTypes.HistoryUncheckedCreateInput> = [];

    if (oldTask.status !== newTask.status) {
      entries.push({
        taskId,
        userId,
        action: HistoryActions.STATUS_CHANGED as HistoryAction,
        oldValue: String(oldTask.status ?? ""),
        newValue: String(newTask.status ?? ""),
      });
    }

    if (oldTask.title !== newTask.title) {
      entries.push({
        taskId,
        userId,
        action: HistoryActions.TITLE_CHANGED as HistoryAction,
        oldValue: String(oldTask.title ?? ""),
        newValue: String(newTask.title ?? ""),
      });
    }

    if (oldTask.priority !== newTask.priority) {
      entries.push({
        taskId,
        userId,
        action: HistoryActions.PRIORITY_CHANGED as HistoryAction,
        oldValue: String(oldTask.priority ?? ""),
        newValue: String(newTask.priority ?? ""),
      });
    }

    if (String(oldTask.assignedToId ?? "") !== String(newTask.assignedToId ?? "")) {
      entries.push({
        taskId,
        userId,
        action: HistoryActions.ASSIGNED as HistoryAction,
        oldValue: String(oldTask.assignedToId ?? ""),
        newValue: String(newTask.assignedToId ?? ""),
      });
    }

    const oldDue = oldTask.dueDate ? (oldTask.dueDate instanceof Date ? oldTask.dueDate.toISOString() : String(oldTask.dueDate)) : "";
    const newDue = newTask.dueDate ? (newTask.dueDate instanceof Date ? newTask.dueDate.toISOString() : String(newTask.dueDate)) : "";

    if (oldDue !== newDue) {
      entries.push({
        taskId,
        userId,
        action: HistoryActions.DUE_DATE_CHANGED as HistoryAction,
        oldValue: oldDue,
        newValue: newDue,
      });
    }

    for (const entry of entries) {
      await ctx.db.history.create({ data: entry });
    }
  }

  async function createNotifications(ctx: Context, oldTask: MinimalTask, newTask: MinimalTask) {
    if (!oldTask.assignedToId && newTask.assignedToId) {
      await ctx.db.notification.create({
        data: {
          userId: String(newTask.assignedToId),
          message: `New task assigned: ${String(newTask.title ?? "")}`,
          type: NotificationTypes.TASK_ASSIGNED as NotificationType,
        },
      });
    }

    if (oldTask.assignedToId && newTask.assignedToId && oldTask.assignedToId !== newTask.assignedToId) {
      await ctx.db.notification.create({
        data: {
          userId: String(newTask.assignedToId),
          message: `Task reassigned: ${String(newTask.title ?? "")}`,
          type: NotificationTypes.TASK_ASSIGNED as NotificationType,
        },
      });
    }

    if ((oldTask.status ?? "") !== "COMPLETED" && newTask.status === "COMPLETED") {
      if (newTask.assignedToId) {
        await ctx.db.notification.create({
          data: {
            userId: String(newTask.assignedToId),
            message: `Task completed: ${String(newTask.title ?? "")}`,
            type: NotificationTypes.TASK_COMPLETED as NotificationType,
          },
        });
      }
    }
  }

  export const taskRouter = createTRPCRouter({
    list: protectedProcedure.query(async ({ ctx }) => {
      const tasks = await ctx.db.task.findMany({
        where: { createdById: String(ctx.session.user.id) },
        include: {
          project: true,
          assignedTo: { select: { id: true, username: true, name: true } },
          createdBy: { select: { id: true, username: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return tasks;
    }),

    create: protectedProcedure.input(CreateTaskSchema).mutation(async ({ ctx, input }) => {
      return await ctx.db.$transaction(async (tx) => {
        const task = await tx.task.create({
          data: {
            title: input.title,
            description: input.description,
            status: input.status,
            priority: input.priority,
            projectId: input.projectId,
            assignedToId: input.assignedToId,
            dueDate: input.dueDate,
            estimatedHours: input.estimatedHours,
            createdById: String(ctx.session.user.id),
          },
          include: {
            project: true,
            assignedTo: { select: { id: true, username: true, name: true } },
            createdBy: { select: { id: true, username: true, name: true } },
          },
        });

        await tx.history.create({
          data: {
            taskId: task.id,
            userId: String(ctx.session.user.id),
            action: HistoryActions.CREATED as HistoryAction,
            oldValue: "",
            newValue: String(task.title ?? ""),
          },
        });

        if (input.assignedToId) {
          await tx.notification.create({
            data: {
              userId: String(input.assignedToId),
              message: `New task assigned: ${String(task.title ?? "")}`,
              type: NotificationTypes.TASK_ASSIGNED as NotificationType,
            },
          });
        }

        // Create system event for audit
        void createSystemEvent({
          type: "TASK_CREATED",
          userId: String(ctx.session.user.id),
          userName: ctx.session.user.name ?? ctx.session.user.email ?? "Unknown",
          projectId: input.projectId,
          taskId: task.id,
          action: `Created task: ${task.title}`,
          details: {
            taskTitle: task.title,
            priority: input.priority,
            assignedTo: input.assignedToId,
          },
        });

        return task;
      });
    }),

    update: protectedProcedure.input(UpdateTaskSchema).mutation(async ({ ctx, input }) => {
      return await ctx.db.$transaction(async (tx) => {
        const oldTask = (await tx.task.findUnique({ where: { id: input.id } })) as MinimalTask | null;

        if (!oldTask) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });

        if (String(oldTask.createdById) !== String(ctx.session.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only update tasks you created" });
        }

        const updatedTask = await tx.task.update({
          where: { id: input.id },
          data: {
            title: input.title,
            description: input.description,
            status: input.status,
            priority: input.priority,
            projectId: input.projectId,
            assignedToId: input.assignedToId,
            dueDate: input.dueDate,
            estimatedHours: input.estimatedHours,
            actualHours: input.actualHours,
          },
          include: {
            project: true,
            assignedTo: { select: { id: true, username: true, name: true } },
            createdBy: { select: { id: true, username: true, name: true } },
          },
        });

        await createHistoryEntries(ctx, input.id, String(ctx.session.user.id), oldTask, updatedTask);
        await createNotifications(ctx, oldTask, updatedTask);

        // Create system event for audit
        void createSystemEvent({
          type: "TASK_UPDATED",
          userId: String(ctx.session.user.id),
          userName: ctx.session.user.name ?? ctx.session.user.email ?? "Unknown",
          projectId: input.projectId,
          taskId: input.id,
          action: `Updated task: ${updatedTask.title}`,
          details: {
            taskTitle: updatedTask.title,
            oldStatus: oldTask.status,
            newStatus: updatedTask.status,
            oldPriority: oldTask.priority,
            newPriority: updatedTask.priority,
          },
        });

        return updatedTask;
      });
    }),

    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      return await ctx.db.$transaction(async (tx) => {
        const task = await tx.task.findUnique({ where: { id: input.id } });

        if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
        if (String(task.createdById) !== String(ctx.session.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete tasks you created" });
        }

        await tx.history.create({
          data: {
            taskId: task.id,
            userId: String(ctx.session.user.id),
            action: HistoryActions.DELETED as HistoryAction,
            oldValue: String(task.title ?? ""),
            newValue: "",
          },
        });

        const deletedTask = await tx.task.delete({ where: { id: input.id } });

        // Create system event for audit
        void createSystemEvent({
          type: "TASK_DELETED",
          userId: String(ctx.session.user.id),
          userName: ctx.session.user.name ?? ctx.session.user.email ?? "Unknown",
          projectId: task.projectId,
          taskId: input.id,
          action: `Deleted task: ${task.title}`,
          details: { taskTitle: task.title },
        });

        return { id: deletedTask.id, message: "Task deleted successfully" };
      });
    }),

    getById: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
        include: {
          project: true,
          assignedTo: { select: { id: true, username: true, name: true } },
          createdBy: { select: { id: true, username: true, name: true } },
          comments: { include: { user: { select: { id: true, username: true, name: true } } } },
          history: { include: { user: { select: { id: true, username: true, name: true } } } },
        },
      });

      if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      return task;
    }),

    search: protectedProcedure.input(SearchTasksSchema).query(async ({ ctx, input }) => {
      const whereConditions: PrismaTypes.TaskWhereInput = { createdBy: { id: String(ctx.session.user.id) } };

      if (input.text?.trim()) {
        whereConditions.OR = [
          { title: { contains: input.text, mode: "insensitive" } },
          { description: { contains: input.text, mode: "insensitive" } },
        ];
      }

      if (input.status && input.status !== "all" && (TaskStatuses as readonly string[]).includes(input.status)) {
        whereConditions.status = input.status as unknown as TaskStatusType;
      }

      if (input.priority && input.priority !== "all" && (TaskPriorities as readonly string[]).includes(input.priority)) {
        whereConditions.priority = input.priority as unknown as TaskPriorityType;
      }

      if (input.projectId && input.projectId !== "all") whereConditions.projectId = parseInt(input.projectId);

      const tasks = await ctx.db.task.findMany({
        where: whereConditions,
        include: {
          project: true,
          assignedTo: { select: { id: true, username: true, name: true } },
          createdBy: { select: { id: true, username: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return tasks;
    }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      const tasks = await ctx.db.task.findMany({ where: { createdBy: { id: String(ctx.session.user.id) } } });

      const completed = tasks.filter((t) => t.status === "COMPLETED").length;
      const pending = tasks.filter((t) => t.status !== "COMPLETED").length;

      return {
        total: tasks.length,
        completed,
        pending,
        completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
      };
    }),
});

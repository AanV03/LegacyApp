import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { createSystemEvent } from "~/server/api/services/eventService";

// ============================================================================
// SCHEMAS
// ============================================================================

const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(255),
  description: z.string().max(1000).optional(),
});

const UpdateProjectSchema = CreateProjectSchema.extend({
  id: z.number().int().positive("Invalid project ID"),
});

// ============================================================================
// ROUTER
// ============================================================================

export const projectRouter = createTRPCRouter({
  /**
   * Get all projects for the current user
   * Includes task count for each project
   */
  list: protectedProcedure.query(async ({ ctx }) => {
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
      } as const,
    });

    return projects;
  }),

  /**
   * Create a new project
   * Automatically sets createdBy to current user
   */
  create: protectedProcedure
    .input(CreateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          description: input.description,
          createdById: ctx.session.user.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      } as const);

      // Create system event for audit
      void createSystemEvent({
        type: "PROJECT_CREATED",
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? ctx.session.user.email ?? "Unknown",
        projectId: project.id,
        action: `Created project: ${project.name}`,
        details: { projectName: project.name },
      });

      return project;
    }),

  /**
   * Update an existing project
   * Validates that current user is the creator
   */
  update: protectedProcedure
    .input(UpdateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify project exists and user is creator
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (project.createdById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update projects you created",
        });
      }

      const updatedProject = await ctx.db.project.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

      return updatedProject;
    }),

  /**
   * Delete a project
   * Also deletes all associated tasks, comments, and history (cascade)
   * Validates that current user is the creator
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      // Verify project exists and user is creator
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (project.createdById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete projects you created",
        });
      }

      // Delete project (cascade will handle tasks, comments, history)
      const deletedProject = await ctx.db.project.delete({
        where: { id: input.id },
      });

      // Create system event for audit
      void createSystemEvent({
        type: "PROJECT_DELETED",
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? ctx.session.user.email ?? "Unknown",
        projectId: input.id,
        action: `Deleted project: ${project.name}`,
        details: { projectName: project.name },
      });

      return {
        id: deletedProject.id,
        message: "Project deleted successfully",
      };
    }),

  /**
   * Get a single project by ID with related data
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Verify user has permission to view
      if (project.createdById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view this project",
        });
      }

      return project;
    }),
});

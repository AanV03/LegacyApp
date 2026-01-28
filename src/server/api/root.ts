import { postRouter } from "~/server/api/routers/post";
import { commentRouter } from "~/server/api/routers/comment";
import { historyRouter } from "~/server/api/routers/history";
import { notificationRouter } from "~/server/api/routers/notification";
import { projectRouter } from "~/server/api/routers/project";
import { reportRouter } from "~/server/api/routers/report";
import { searchRouter } from "~/server/api/routers/search";
import { taskRouter } from "~/server/api/routers/task";
import { userRouter } from "~/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  comment: commentRouter,
  history: historyRouter,
  notification: notificationRouter,
  project: projectRouter,
  report: reportRouter,
  search: searchRouter,
  task: taskRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

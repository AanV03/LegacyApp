import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => {
    // Return the session user (includes id, name, email, role?, roles?)
    return ctx.session.user;
  }),
});

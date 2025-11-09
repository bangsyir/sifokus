import { and, desc, eq } from "drizzle-orm";
import { data } from "react-router";
import z from "zod";
import { db } from "~/db/drizzle";
import { taskCycles, taskSessions } from "~/db/schema";
import { errorResponse, successResponse } from "~/utils/app-response";
import { safeDb } from "~/utils/promise-db-wrap";

export const taskSessionsServices = {
  start: async (safeTaskId: string, userId: string) => {
    // find the task - for check how many cycles and session done
    // find last running session
    const existSession = await safeDb(
      async () => {
        const result = await db
          .select()
          .from(taskSessions)
          .where(eq(taskSessions.taskId, safeTaskId))
          .orderBy(desc(taskSessions.startedAt))
          .limit(1);
        return result;
      },
      { action: "find-task-session", entity: "task_sessions" },
    );
    if (!existSession.success)
      return data(
        errorResponse({
          message: existSession.error.message,
        }),
        { status: existSession.error.status },
      );
    if (existSession.data?.length === 0) {
      // if session is not not exist
      const createSession = await safeDb(
        async () => {
          await db.transaction(async (tx) => {
            const [activeCycle] = await tx
              .select({ id: taskCycles.id })
              .from(taskCycles)
              .where(
                and(
                  eq(taskCycles.taskId, safeTaskId),
                  eq(taskCycles.userId, userId),
                  eq(taskCycles.status, "active"),
                ),
              );
            await tx
              .insert(taskSessions)
              .values({
                userId: userId,
                taskId: safeTaskId,
                cycleId: activeCycle.id,
                startedAt: new Date(),
                type: "work",
                duration: 0,
              })
              .returning();
          });
          return;
        },
        { action: "start-session", entity: "task-cycles-sessions" },
      );
      if (!createSession.success) {
        return data(
          errorResponse({
            message: createSession.error.message,
          }),
          { status: createSession.error.status },
        );
      }
      return data(successResponse({ message: "Task is started" }));
    }
    const updateExistSession = await safeDb(
      async () => {
        await db.update(taskSessions).set({ status: "running" });
      },
      { action: "update-exist-session", entity: "task-session" },
    );
    if (!updateExistSession.success) {
      return data(
        errorResponse({
          message: updateExistSession.error.message,
        }),
        { status: updateExistSession.error.status },
      );
    }
    return data(successResponse({ message: "Task is started" }));
  },
  pause: async (safeTaskId: string) => {
    const existSession = await safeDb(
      async () => {
        return await db
          .select()
          .from(taskSessions)
          .where(eq(taskSessions.taskId, safeTaskId))
          .orderBy(desc(taskSessions.startedAt))
          .limit(1);
      },
      { action: "exist-session-pause", entity: "task-session" },
    );
    if (!existSession.success)
      return data(
        errorResponse({
          message: existSession.error.message,
        }),
        { status: existSession.error.status },
      );
    if (existSession.data?.length === 0) {
      return data(
        errorResponse({
          message: "task session not exist",
        }),
        { status: 404 },
      );
    }
    const result = await safeDb(
      async () => {
        await db
          .update(taskSessions)
          .set({ status: "paused", endedAt: new Date() })
          .where(eq(taskSessions.id, existSession.data?.[0].id!));
      },
      {
        action: "pause-session",
        entity: "task-sessions",
      },
    );
    if (!result.success) {
      return data(
        errorResponse({
          message: result.error.message,
        }),
        { status: result.error.status },
      );
    }
    return data(successResponse({ message: "Task is pause" }));
  },
};

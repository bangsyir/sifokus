import { and, desc, eq, sql } from "drizzle-orm";
import { data } from "react-router";
import { success } from "zod";
import { db } from "~/db/drizzle";
import { taskCycles, tasks, taskSessions } from "~/db/schema";
import { DatabaseError } from "~/errors/database-error";
import { tasksRepositories } from "~/repositories/task-repo.server";
import { errorResponse, successResponse } from "~/utils/app-response";
import { safeDb } from "~/utils/promise-db-wrap";

export const taskSessionsServices = {
  start: async (safeTaskId: string, userId: string) => {
    // find the task - for check how many cycles and session done
    const task = await safeDb(
      async () => {
        const task =
          await tasksRepositories.getTaskWithCycleSession(safeTaskId);
        if (task.length === 0)
          throw new DatabaseError("task not found", "TASK_NOT_FOUND", 404);
        return task;
      },
      { action: "find-task", entity: "tasks" },
    );
    if (!task.success) {
      return data(
        errorResponse({
          message: task.error.message,
          details: task.error.cause,
        }),
        { status: task.error.status },
      );
    }

    // find last running session ---> this part should be remove, just use find task to handle it
    let taskSession = task.data?.[0].session;
    // if cycle null create new task session
    if (taskSession === null) {
      // if session is not not exist
      const createSession = await safeDb(
        async () => {
          await db.transaction(async (tx) => {
            await tx
              .update(taskCycles)
              .set({
                startedAt: new Date(),
              })
              .where(eq(taskCycles.id, task.data?.[0].cycle?.id!));
            await tx
              .insert(taskSessions)
              .values({
                userId: userId,
                taskId: safeTaskId,
                cycleId: task.data?.[0].cycle?.id!,
                startedAt: new Date(),
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
        await db
          .update(taskSessions)
          .set({ status: "running", startedAt: new Date() })
          .where(eq(taskSessions.id, task.data?.[0].session?.id!));
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
        const startDate = new Date(existSession.data?.[0].startedAt!);
        const now = new Date();
        await db
          .update(taskSessions)
          .set({
            status: "paused",
            startedAt: null,
            endedAt: new Date(),
            duration:
              existSession.data?.[0].duration! +
              Math.floor((now.getTime() - startDate.getTime()) / 1000),
          })
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
  completedSession: async (safeTaskId: string) => {
    const result = await safeDb(
      async () => {
        const task =
          await tasksRepositories.getTaskWithCycleSession(safeTaskId);
        if (task.length === 0)
          throw new DatabaseError("Task not found", "TASK_NOT_FOUND", 404);
        if (task[0].cycle === null || task[0].session === null) {
          throw new DatabaseError(
            "Ops cycle or session is not found",
            "CYCLE_OR_SESSION_NOT_FOUND",
            404,
          );
        }
        const totalCeil = (task[0].totalCycle + 1) * 4;
        const startDate = new Date(task[0].session?.startedAt!);
        const now = new Date();

        await db.transaction(async (tx) => {
          // updated tasks total session
          // if task total cycle more the cycle ceil example 4 ,8  etc create new taskCycles
          // else just update taskCycles and completed the taskSessions
          if (task[0].totalSession >= totalCeil) {
            await tx
              .update(tasks)
              .set({
                totalSession: task[0].totalSession + 1,
                totalCycle: task[0].totalCycle + 1,
              })
              .where(eq(tasks.id, safeTaskId));
            await tx
              .update(taskCycles)
              .set({
                endAt: new Date(),
                status: "completed",
              })
              .where(eq(taskCycles.id, task[0].cycle?.id!));
            await tx
              .update(taskSessions)
              .set({
                duration:
                  task[0]?.session?.duration! +
                  Math.floor((now.getTime() - startDate.getTime()) / 1000),
                status: "completed",
              })
              .where(eq(taskSessions.id, task[0].session?.id!));
            await tx.insert(taskCycles).values({
              userId: task[0].userId,
              taskId: task[0].id,
              status: "active",
            });
          } else {
            await tx
              .update(tasks)
              .set({ totalSession: task[0].totalSession + 1 })
              .where(eq(tasks.id, safeTaskId));
            await tx
              .update(taskCycles)
              .set({
                endAt: new Date(),
                completedSessions: task[0].cycle?.completedSession! + 1,
              })
              .where(eq(taskCycles.id, task[0].cycle?.id!));
            await tx
              .update(taskSessions)
              .set({
                duration:
                  task[0]?.session?.duration! +
                  Math.floor((now.getTime() - startDate.getTime()) / 1000),
                status: "completed",
              })
              .where(eq(taskSessions.id, task[0].session?.id!));
          }
        });
      },
      { action: "update-completed", entity: "tasks-cycles-sessions" },
    );
    if (!result.success) {
      return data(
        errorResponse({
          message: result.error.message,
          details: result.error.cause,
        }),
        { status: result.error.status },
      );
    }
    return data(successResponse({ message: "Yayy one session is completed" }));
  },
};

import { and, desc, eq, isNotNull, not, sql } from "drizzle-orm";
import { db } from "~/db/drizzle";
import { taskCycles, tasks, taskSessions } from "~/db/schema";

export const tasksRepositories = {
  getTaskWithCycleSession: async (safeTaskId: string) => {
    const latestCycle = db
      .select({
        id: taskCycles.id,
        status: taskCycles.status,
        completedSessions: taskCycles.completedSessions,
      })
      .from(taskCycles)
      .where(
        and(eq(taskCycles.taskId, safeTaskId), eq(taskCycles.status, "active")),
      )
      .orderBy(desc(taskCycles.id))
      .limit(1)
      .as("cycle");
    const latestSession = db
      .select()
      .from(taskSessions)
      .where(
        and(
          eq(taskSessions.taskId, safeTaskId),
          not(eq(taskSessions.status, "completed")),
        ),
      )
      .orderBy(desc(taskSessions.startedAt))
      .limit(1)
      .as("session");
    const task = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        totalCycle: tasks.totalCycle,
        totalSession: tasks.totalSession,
        completed: tasks.completed,
        userId: tasks.userId,
        cycle: {
          id: latestCycle.id,
          status: latestCycle.status,
          completedSession: latestCycle.completedSessions,
        },
        session: {
          id: latestSession.id,
          status: latestSession.status,
          completed: latestSession.completed,
          startedAt: latestSession.startedAt,
          duration: latestSession.duration,
        },
      })
      .from(tasks)
      .leftJoinLateral(latestCycle, eq(sql`1`, sql`1`))
      .leftJoinLateral(latestSession, eq(sql`1`, sql`1`))
      .where(eq(tasks.id, safeTaskId));
    return task;
  },
};

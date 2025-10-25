// app/routes/pomodoro.complete.tsx
import { data } from "react-router";
import { db } from "~/db/drizzle";
import { pomodoroSessions, tasks } from "~/db/schema";
import { eq } from "drizzle-orm";

export const action: ActionFunction = async ({ request }) => {
  const body = await request.json();
  const taskId = Number(body.taskId);
  const duration = Number(body.duration) || 25 * 60;

  if (!taskId) return data({ ok: false }, { status: 400 });

  await db.insert(pomodoroSessions).values({ taskId, duration });
  await db
    .update(tasks)
    .set({ status: "completed" })
    .where(eq(tasks.id, taskId));

  return json({ ok: true });
};

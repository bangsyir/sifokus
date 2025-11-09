## start task example


```ts
import { ActionFunctionArgs, json } from "react-router";
import { db } from "~/db/drizzle.server";
import { taskSessions, taskCycles } from "~/db/schema";
import { eq, and, count } from "drizzle-orm";

export async function action({ params }: ActionFunctionArgs) {
  const taskId = params.taskId!;

  // 1️⃣ Find last running session
  const [lastSession] = await db
    .select()
    .from(taskSessions)
    .where(and(eq(taskSessions.taskId, taskId), eq(taskSessions.status, "running")))
    .limit(1);

  if (!lastSession) return json({ ok: false, message: "No active session" }, { status: 400 });

  // 2️⃣ Mark as completed
  await db
    .update(taskSessions)
    .set({ status: "completed", endedAt: new Date() })
    .where(eq(taskSessions.id, lastSession.id));

  // 3️⃣ Count focus sessions
  const [focusCount] = await db
    .select({ count: count() })
    .from(taskSessions)
    .where(and(eq(taskSessions.taskCycleId, lastSession.taskCycleId), eq(taskSessions.type, "focus")));

  let nextType: "focus" | "short_break" | "long_break" = "focus";

  if (lastSession.type === "focus") {
    nextType = focusCount.count >= 4 ? "long_break" : "short_break";
  } else if (["short_break", "long_break"].includes(lastSession.type)) {
    nextType = "focus";
  }

  // 4️⃣ Handle cycle completion
  if (focusCount.count >= 4) {
    await db
      .update(taskCycles)
      .set({ status: "completed", endedAt: new Date() })
      .where(eq(taskCycles.id, lastSession.taskCycleId));

    await db.insert(taskCycles).values({
      taskId,
      status: "active",
      startedAt: new Date(),
    });
  }

  return json({ ok: true, nextType });
}
```
```
```

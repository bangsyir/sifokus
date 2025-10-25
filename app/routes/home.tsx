import { useFetcher, useLoaderData } from "react-router";
import {
  data,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { db } from "~/db/drizzle";
import { tasks, pomodoroSessions } from "~/db/schema";
import { desc, eq } from "drizzle-orm";
import TaskTimer from "~/components/TaskTimer";
import { useEffect } from "react";

// ---------- LOADER ----------
export async function loader({}: LoaderFunctionArgs) {
  const allTasks = await db.select().from(tasks).orderBy(desc(tasks.id));
  const allSessions = await db.select().from(pomodoroSessions);
  return data({ tasks: allTasks, sessions: allSessions });
}

// ---------- ACTION ----------
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "add-task") {
    const title = formData.get("title")?.toString() ?? "";
    if (!title) throw new Response("Title required", { status: 400 });
    await db.insert(tasks).values({
      title,
      status: "pending",
      createdAt: new Date(),
    });
    return redirect("/");
  }

  if (intent === "complete-task") {
    const taskId = Number(formData.get("taskId"));
    if (isNaN(taskId)) throw new Response("Invalid task id", { status: 400 });
    await db.update(tasks).set({ status: "done" }).where(eq(tasks.id, taskId));
    await db.insert(pomodoroSessions).values({
      duration: 25 * 60,
      completedAt: null,
      startedAt: Math.floor(Date.now() / 1000),
      taskId,
    });
    return redirect("/");
  }

  return redirect("/");
}

// ---------- COMPONENT ----------
export default function Index() {
  const { tasks, sessions } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  // const { activeTaskId } = useTimerStore();

  // 🔔 Notification permission request
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleCompleteTask = (taskId: number) => {
    fetcher.submit({ intent: "complete-task", taskId }, { method: "post" });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-4 text-center">Pomodoro Focus</h1>

      {/* ---------- Add Task Form ---------- */}
      <fetcher.Form method="post" className="flex gap-2">
        <input
          type="text"
          name="title"
          placeholder="New task..."
          className="flex-1 px-3 py-2 border rounded"
          required
        />
        <button
          type="submit"
          name="intent"
          value="add-task"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </fetcher.Form>

      {/* ---------- Task List ---------- */}
      <div className="space-y-3">
        {tasks.length === 0 && (
          <p className="text-center text-gray-500">No tasks yet.</p>
        )}

        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between border rounded p-3 shadow-sm bg-white"
          >
            <p
              className={`font-semibold ${task.status === "done" ? "line-through text-gray-400" : ""}`}
            >
              {task.title}
            </p>
            <div className="flex items-center gap-2">
              {task.status !== "done" && <UpdateSession taskId={task.id} />}
              {task.status === "pending" && (
                <TaskTimer
                  taskId={task.id}
                  onComplete={() => handleCompleteTask(task.id)}
                />
              )}
            </div>
            {task.status === "done" && (
              <span className="text-green-600">✅ Done</span>
            )}
          </div>
        ))}
      </div>

      {/* ---------- Sessions Summary ---------- */}
      <div className="pt-6 border-t">
        <h2 className="text-xl font-bold mb-2">Completed Sessions</h2>
        <p>Total: {sessions.length}</p>
      </div>
    </div>
  );
}

function UpdateSession({ taskId }: { taskId: number }) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post" className="flex gap-2">
      <input type="hidden" name="taskId" value={taskId} />
      <button
        type="submit"
        name="intent"
        value="complete-task"
        className="px-2 py-1 rounded border"
      >
        Done
      </button>
    </fetcher.Form>
  );
}

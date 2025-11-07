import { TaskList } from "~/components/task-list";
import {
  TimerDisplay,
  TimerController,
  ProgressIndicator,
  SessionTypeToggle,
} from "~/components/timer";
import type { Route } from "./+types/tasks";
import { db } from "~/db/drizzle";
import { taskCycles, tasks, taskSessions } from "~/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { data, Outlet, redirect } from "react-router";
import { AddTaskForm } from "~/components/add-task";
import { usePomodoroStore } from "~/store/usePomodoroStore";
import { authMiddleware } from "~/middleware/auth";
import { userContext } from "~/context";
import { errorResponse, successResponse } from "~/utils/app-response";
import { createTaskSchema } from "~/validation/task-validation";
import z from "zod";
import { safeDb } from "~/utils/promise-db-wrap";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Button } from "~/components/ui/button";
import { ChevronsUpDown, Info } from "lucide-react";
import React from "react";

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
  const authUser = context.get(userContext);
  if (!authUser) {
    return redirect("/login");
  }
  const results = await safeDb(
    async () => {
      return await db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          createdAt: tasks.createdAt,
          completed: tasks.completed,
          totalCycle: tasks.totalCycle,
          totalSession: tasks.totalSession,
        })
        .from(tasks)
        .where(eq(tasks.userId, authUser.userId));
    },
    { action: "getTaskList", entity: "tasks" },
  );

  if (!results.success) {
    return data(
      errorResponse({
        message: results.error.message,
      }),
      { status: results.error.status },
    );
  }

  return data(
    successResponse({
      message: "Success retrive data",
      data: results.data,
    }),
  );
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (!intent || typeof intent !== "string") {
    throw new Error("Intent not be null and format must be valid");
  }
  const authUser = context.get(userContext);
  if (!authUser) {
    return redirect("/login");
  }
  if (intent === "create-task") {
    const title = formData.get("title");
    const description = formData.get("description");
    const result = createTaskSchema.safeParse({ title, description });
    if (!result.success) {
      const flattened = z.flattenError(result.error);
      return data(
        errorResponse({
          message: "Input error",
          details: flattened,
        }),
        { status: 400 },
      );
    }
    await db.transaction(async (tx) => {
      // create new task
      const [task] = await tx
        .insert(tasks)
        .values({
          userId: authUser.userId,
          title: result.data.title,
          description: result.data.description,
        })
        .returning({ id: tasks.id });
      // create task cycle
      await tx.insert(taskCycles).values({
        userId: authUser.userId,
        taskId: task.id,
        status: "active",
      });
    });
    return data(successResponse({ message: "create task successful" }));
  }
  if (intent === "start-session") {
    const taskId = formData.get("taskId");
    const schema = z.uuidv7();
    const safeTaskId = schema.parse(taskId);
    if (!safeTaskId) {
      return data(errorResponse({ message: "task id is require" }), {
        status: 400,
      });
    }
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
                  eq(taskCycles.userId, authUser.userId),
                  eq(taskCycles.status, "active"),
                ),
              );
            await tx
              .insert(taskSessions)
              .values({
                userId: authUser.userId,
                taskId: safeTaskId,
                cycleId: activeCycle.id,
                startedAt: new Date(),
                type: "work",
                duration: 25 * 60,
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
  }
  if (intent === "pause-session") {
    const taskId = formData.get("taskId");
    const schema = z.uuidv7();
    const safeTaskId = schema.parse(taskId);
    if (!safeTaskId) throw new Error("task session id not found");
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
  }

  if (intent === "delete-task") {
    const taskId = formData.get("taskId");
    const schema = z.uuidv7();
    const safeTaskId = schema.parse(taskId);
    if (!safeTaskId) {
      return data(errorResponse({ message: "task id is require" }), {
        status: 400,
      });
    }
    const result = await safeDb(
      async () => {
        await db.delete(tasks).where(eq(tasks.id, safeTaskId));
      },
      {
        action: "delete-task",
        entity: "task",
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
    return data(successResponse({ message: "task successful deleted" }), {
      status: 200,
    });
  }
  return {};
}

export default function Tasks({ loaderData }: Route.ComponentProps) {
  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Timer Section */}
          <div className="w-full space-y-6 lg:w-1/2">
            <div className="flex flex-col items-center justify-center space-y-6 pt-8">
              <TaskHeader />
              <TimerDisplay />
              <TimerController />
              <SessionTypeToggle />
              <ProgressIndicator />
              <Instruction />
            </div>
            <Outlet />
          </div>

          {/* Task Section */}
          <div className="w-full space-y-4 lg:w-1/2">
            <AddTaskForm />
            <TaskList tasksList={loaderData.data} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskHeader() {
  const { activeTaskId, tasks } = usePomodoroStore();
  return (
    <>
      <h1 className="text-3xl font-bold capitalize">
        {tasks[activeTaskId!]?.sessionType?.replace("_", " ") ?? "Focus"} Time
      </h1>
      <div className="w-full truncate rounded-md border border-1 bg-secondary p-1 text-center text-primary">
        {tasks[activeTaskId!]?.title ?? "No task ative"}
      </div>
    </>
  );
}

function Instruction() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full rounded-lg border p-1"
    >
      <div className="flex items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-1">
          <Info className="h-5 w-5 text-primary" />
          <h4 className="text-sm font-semibold">
            How to Use Pomodoro Technique
          </h4>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="icon" className="size-8">
            <ChevronsUpDown />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="p-1">
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="font-bold text-primary">1.</span>
            <span>Choose a task you want to complete.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary">2.</span>
            <span>
              Set the timer for 25 minutes and focus on your task until it
              rings.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary">3.</span>
            <span>
              Take a 5-minute break. Do something simple that relaxes you.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary">4.</span>
            <span>
              Start another 25-minute work session, then take another 5-minute
              break.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary">5.</span>
            <span>
              After completing 4 cycles, take a longer break of 15-30 minutes.
            </span>
          </li>
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}

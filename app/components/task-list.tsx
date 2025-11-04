import { usePomodoroStore } from "~/store/usePomodoroStore";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Trash2 } from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  completedSession: number | null;
  createdAt: Date;
};

export function TaskList({ tasks }: { tasks: Task[] }) {
  const { activeTaskId, selectTask, sessionStatus } = usePomodoroStore();

  function handleSetTask(task: Task) {
    const isClickable = canSelectTask(task.id);
    if (isClickable && !task.completed) {
      selectTask(task.id, task.completedSession!);
    }
  }
  const canSelectTask = (taskId: string) => {
    // Can select if timer is not running, or if it's the active task
    return sessionStatus !== "running" || taskId === activeTaskId;
  };
  return (
    <div>
      {tasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No tasks yet. Add one to get started!
        </p>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-2 pr-4">
            {tasks.map((task) => {
              const isActive = task.id === activeTaskId;
              const isClickable = canSelectTask(task.id);
              return (
                <div
                  key={task.id}
                  className={`group rounded-lg border p-3 transition-all ${isActive ? "border-foreground bg-accent/5" : "border-border"} ${isClickable && !task.completed ? "cursor-pointer hover:border-foreground/50" : "cursor-not-allowed opacity-60"} `}
                  onClick={() => handleSetTask(task)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`text-md truncate font-bold ${task.completed ? "text-muted-foreground line-through" : ""}`}
                      >
                        {task.title}
                      </h3>
                      <p
                        className={`truncate text-sm font-light ${task.completed ? "text-muted-foreground line-through" : ""}`}
                      >
                        {task.description}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 flex-shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

import { usePomodoroStore } from "~/store/usePomodoroStore";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Check, CheckCircle, EllipsisVertical, Trash2 } from "lucide-react";
import { useFetcher } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import React from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { taskCycles } from "~/db/schema";
import { Skeleton } from "./ui/skeleton";

type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  totalCycle: number | null;
  totalSession: number | null;
  createdAt: Date;
};

export function TaskList({ tasks }: { tasks: Task[] }) {
  const { activeTaskId, selectTask, sessionStatus, resetAll } =
    usePomodoroStore();
  const deleteFetcher = useFetcher();

  const [open, setOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState("");

  function handleSetTask(task: Task) {
    selectTask(task.id, task.totalSession!);
  }
  const canSelectTask = (taskId: string) => {
    // Can select if timer is not running, or if it's the active task
    return sessionStatus !== "running" || taskId === activeTaskId;
  };

  function handleOpenAlertDianlog(taskId: string) {
    setDeleteId(taskId);
    setOpen(true);
  }

  const handleDeleteTask = (taskId: string) => {
    if (taskId === activeTaskId) {
      resetAll();
    }
    deleteFetcher.submit(
      { intent: "delete-task", taskId: taskId },
      { method: "post" },
    );
    setOpen(false);
    setDeleteId("");
  };
  React.useEffect(() => {
    if (!deleteFetcher?.data) return;
    if (!deleteFetcher?.data?.success) {
      toast.error(deleteFetcher?.data?.message);
    }
    toast.success(deleteFetcher?.data?.message);
  }, [deleteFetcher?.data]);

  return (
    <>
      <div className="h-[400px] rounded-lg border md:h-[calc(100vh-280px)]">
        {tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tasks yet. Add one to get started!
          </p>
        ) : (
          <ScrollArea className="h-[400px] rounded-lg border border-border bg-card p-4 md:h-full md:p-6">
            <div className="space-y-2">
              {tasks.map((task) => {
                const isActive = task.id === activeTaskId;
                const isClickable = canSelectTask(task.id);
                const isRunning = sessionStatus === "running";
                return (
                  <div
                    key={task.id}
                    className={`group rounded-lg border p-3 transition-all ${isActive ? "border-foreground" : "cursor-not-allowed"} ${isClickable && !task.completed ? "cursor-pointer hover:border-foreground/50" : "cursor-not-allowed opacity-60"} `}
                    onClick={() => {
                      if (isClickable && !isActive) {
                        handleSetTask(task);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <CompleteSession
                          totalSession={task.totalSession!}
                          totalCycle={task.totalCycle!}
                        />
                        <h4
                          className={`text-md truncate font-bold ${task.completed ? "text-muted-foreground line-through" : ""}`}
                        >
                          {task.title}
                        </h4>
                        <p
                          className={`text-sm font-light ${task.completed ? "text-muted-foreground line-through" : ""}`}
                        >
                          {task.description}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          disabled={!isClickable || isRunning}
                        >
                          <div
                            className={`flex-shrink-0 p-0 opacity-50 transition-opacity group-hover:opacity-100 ${isRunning && "cursor-not-allowed"}`}
                          >
                            <EllipsisVertical className="h-4 w-4" />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <div className="flex items-center gap-1.5">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Complete
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenAlertDianlog(task.id)}
                          >
                            <div className="flex items-center gap-1.5">
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span>Remove</span>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
      {/* single shared alertDialog  */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              task from servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteTask(deleteId)}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CompleteSession({
  totalCycle,
  totalSession,
}: {
  totalCycle: number;
  totalSession: number;
}) {
  const [hydrate, setHydrate] = React.useState(false);

  React.useEffect(() => {
    setHydrate(true);
  }, [totalCycle]);
  if (!hydrate) {
    return (
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton className="h-2 w-2 border" key={i} />
        ))}
      </div>
    );
  }
  const dots: number = totalCycle == 0 ? 4 : totalCycle * 4;
  const activeDots: number = totalSession;
  return (
    <div className="relative pb-2">
      <div className="absolute flex items-center gap-1">
        {Array.from({ length: dots }, (_, i) => (
          <span
            className="h-2 w-2 rounded-full border border-foreground"
            key={i}
          ></span>
        ))}
      </div>
      <div className="absolute flex items-center gap-1">
        {Array.from({ length: activeDots }, (_, i) => (
          <span
            className="h-2 w-2 rounded-full border bg-primary"
            key={i}
          ></span>
        ))}
      </div>
    </div>
  );
}

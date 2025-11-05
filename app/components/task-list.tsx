import { usePomodoroStore } from "~/store/usePomodoroStore";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Trash2 } from "lucide-react";
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

type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  completedSession: number | null;
  createdAt: Date;
};

export function TaskList({ tasks }: { tasks: Task[] }) {
  const { activeTaskId, selectTask, sessionStatus, resetAll } =
    usePomodoroStore();
  const deleteFetcher = useFetcher();

  const [open, setOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState("");

  function handleSetTask(task: Task) {
    selectTask(task.id, task.completedSession!);
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
      <div className="">
        {tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tasks yet. Add one to get started!
          </p>
        ) : (
          <ScrollArea className="h-[400px] rounded-lg border border-border bg-card p-4 md:h-[500px] md:p-6">
            <div className="space-y-2">
              {tasks.map((task) => {
                const isActive = task.id === activeTaskId;
                const isClickable = canSelectTask(task.id);
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
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3
                          className={`text-md truncate font-bold ${task.completed ? "text-muted-foreground line-through" : ""}`}
                        >
                          {task.title}
                        </h3>
                        <p
                          className={`text-sm font-light ${task.completed ? "text-muted-foreground line-through" : ""}`}
                        >
                          {task.description}
                        </p>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAlertDianlog(task.id);
                        }}
                        size="sm"
                        variant="ghost"
                        disabled={!isClickable || isActive}
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

import { usePomodoroStore } from "~/store/usePomodoroStore";
import { Button } from "./ui/button";
import { Coffee, Pause, Play, RotateCcw, Settings, Timer } from "lucide-react";
import React from "react";
import { Skeleton } from "./ui/skeleton";
import { useFetcher } from "react-router";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
export function TimerDisplay() {
  const { activeTaskId, tasks } = usePomodoroStore();

  return (
    <div className="flex items-center justify-center rounded-[40%] bg-background md:h-56 md:w-80 md:border-4 md:border-border">
      <div
        className={`text-9xl font-bold tabular-nums md:text-[200px] ${tasks[activeTaskId!]?.sessionStatus === "running" ? "timer-pulse" : ""}`}
      >
        {formatTime(tasks[activeTaskId!]?.remainingTime || 0)}
      </div>
    </div>
  );
}

export function TimerController() {
  const fetcher = useFetcher();
  const [hydrate, setHydrate] = React.useState(false);
  const { activeTaskId, tasks, pauseTask, startTask, resetTask } =
    usePomodoroStore();

  React.useEffect(() => {
    setHydrate(true);
  }, [hydrate]);

  if (!hydrate) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 min-w-32 bg-accent" />
        <Skeleton className="h-10 min-w-32 bg-accent" />
      </div>
    );
  }

  const isRunning = tasks[activeTaskId!]?.sessionStatus === "running";
  function playStopHandle(taskId: string) {
    if (!taskId) return alert("Opss task id not provided");

    if (typeof window === "undefined") return;
    if (isRunning) {
      new Audio("/notify-2.wav").play();
      // set stop-session usign fetch.submit
      // ...code here
      if (tasks[activeTaskId!].sessionType === "focus") {
        fetcher.submit({ intent: "pause-session", taskId }, { method: "post" });
      }
      pauseTask();
    } else {
      // new Audio("vine-boom.mp3").play();
      new Audio("/notify.wav").play();
      // set start-session usign fetch.submit
      // ...code here
      if (tasks[activeTaskId!].sessionType === "focus") {
        fetcher.submit({ intent: "start-session", taskId }, { method: "post" });
      }
      startTask();
    }
  }
  return (
    <div className="flex items-center gap-3">
      <Button
        size="lg"
        onClick={() => playStopHandle(activeTaskId!)}
        disabled={activeTaskId ? false : true}
        variant="ghost"
      >
        {isRunning ? (
          <>
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Play
          </>
        )}
      </Button>

      <Button
        size="lg"
        variant="ghost"
        onClick={() => resetTask()}
        disabled={isRunning}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset
      </Button>
    </div>
  );
}

export const SessionTypeToggle = () => {
  const { setSessionType, tasks, activeTaskId } = usePomodoroStore();
  const isDisabled = tasks[activeTaskId!]?.sessionStatus === "running";

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={
          tasks[activeTaskId!]?.sessionType === "focus" ? "outline" : "ghost"
        }
        size="sm"
        onClick={() => setSessionType("focus")}
        disabled={isDisabled}
        className={`gap-2 ${tasks[activeTaskId!]?.sessionType === "focus" ? "text-primary" : ""}`}
      >
        <Settings className="h-4 w-4" />
        Focus
      </Button>
      <Button
        variant={
          tasks[activeTaskId!]?.sessionType === "short_break"
            ? "outline"
            : "ghost"
        }
        size="sm"
        onClick={() => setSessionType("short_break")}
        disabled={isDisabled}
        className={`gap-2 ${tasks[activeTaskId!]?.sessionType === "short_break" ? "text-primary" : ""}`}
      >
        <Coffee className="h-4 w-4" />
        Break
      </Button>
      <Button
        variant={
          tasks[activeTaskId!]?.sessionType === "long_break"
            ? "outline"
            : "ghost"
        }
        size="sm"
        onClick={() => setSessionType("long_break")}
        disabled={isDisabled}
        className={`gap-2 ${tasks[activeTaskId!]?.sessionType === "long_break" ? "text-primary" : ""}`}
      >
        <Timer className="h-4 w-4" />
        Long Break
      </Button>
    </div>
  );
};

export const ProgressIndicator = () => {
  const { tasks, activeTaskId } = usePomodoroStore();

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">
        Progress to Long Break
      </p>

      <div className="flex items-center justify-center gap-4">
        {[0, 1, 2, 3]?.map((cycle) => (
          <div
            key={cycle}
            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors ${
              cycle <
              tasks[activeTaskId!]?.cycleCount -
                Math.floor(tasks[activeTaskId!]?.cycleCount / 4) * 4
                ? "border-primary bg-primary"
                : "border-border bg-background"
            }`}
          />
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {tasks[activeTaskId!]?.cycleCount ?? "0"}/4 cycles completed
      </p>
    </div>
  );
};

import { usePomodoroStore } from "~/store/usePomodoroStore";
import { Button } from "./ui/button";
import { Coffee, Pause, Play, RotateCcw, Settings, Timer } from "lucide-react";
import React from "react";
import { Skeleton } from "./ui/skeleton";

function formatTime(seconds: number) {
  // if (!seconds) {
  //   return "25:00";
  // }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
export function TimerDisplay() {
  const { tick, activeTaskId, remainingTime, sessionStatus } =
    usePomodoroStore();

  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, [activeTaskId]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (sessionStatus === "running") {
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionStatus, hydrated]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center rounded-[40%] bg-background md:h-64 md:w-80 md:border-4 md:border-border">
        <div className="flex gap-4">
          <Skeleton className="h-30 w-30" />
          <Skeleton className="h-30 w-30" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center rounded-[40%] bg-background md:h-64 md:w-80 md:border-4 md:border-border">
      <div
        className={`text-8xl font-bold tabular-nums ${sessionStatus === "running" ? "timer-pulse" : ""}`}
      >
        {formatTime(remainingTime)}
      </div>
    </div>
  );
}

export function TimerController() {
  const [hydrate, setHydrate] = React.useState(false);
  const { activeTaskId, sessionStatus, pauseTask, startTask, resetTask } =
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

  const isRunning = sessionStatus === "running";
  function playStopHandle(e: React.SyntheticEvent) {
    e.preventDefault();
    if (isRunning) {
      new Audio("/notify-2.wav").play();
      // set stop-session usign fetch.submit
      // ...code here
      pauseTask(activeTaskId!);
    } else {
      // new Audio("vine-boom.mp3").play();
      new Audio("/notify.wav").play();
      // set start-session usign fetch.submit
      // ...code here
      startTask();
    }
  }
  return (
    <div className="flex items-center gap-3">
      <Button
        size="lg"
        onClick={playStopHandle}
        disabled={activeTaskId ? false : true}
        className="min-w-32"
        variant="outline"
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
        onClick={() => resetTask(activeTaskId!)}
        disabled={isRunning}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset
      </Button>
    </div>
  );
}

export const SessionTypeToggle = () => {
  const { setSessionType, sessionType, sessionStatus, activeTaskId } =
    usePomodoroStore();
  const isDisabled = sessionStatus === "running";

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={sessionType === "focus" ? "outline" : "ghost"}
        size="sm"
        onClick={() => setSessionType("focus")}
        disabled={isDisabled}
        className={`gap-2 ${sessionType === "focus" ? "text-primary" : ""}`}
      >
        <Settings className="h-4 w-4" />
        Focus
      </Button>
      <Button
        variant={sessionType === "short_break" ? "outline" : "ghost"}
        size="sm"
        onClick={() => setSessionType("short_break")}
        disabled={isDisabled}
        className={`gap-2 ${sessionType === "short_break" ? "text-primary" : ""}`}
      >
        <Coffee className="h-4 w-4" />
        Break
      </Button>
      <Button
        variant={sessionType === "long_break" ? "outline" : "ghost"}
        size="sm"
        onClick={() => setSessionType("long_break")}
        disabled={isDisabled}
        className={`gap-2 ${sessionType === "long_break" ? "text-primary" : ""}`}
      >
        <Timer className="h-4 w-4" />
        Long Break
      </Button>
    </div>
  );
};

export const ProgressIndicator = () => {
  const { cyclesCount } = usePomodoroStore();

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">
        Progress to Long Break
      </p>

      <div className="flex items-center justify-center gap-4">
        {[0, 1, 2, 3].map((cycle) => (
          <div
            key={cycle}
            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors ${
              cycle < cyclesCount
                ? "border-primary bg-primary"
                : "border-border bg-background"
            }`}
          />
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {cyclesCount ?? "0"}/4 cycles completed
      </p>
    </div>
  );
};

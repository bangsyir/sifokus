import { useEffect, useRef, useState } from "react";
import { useTimerStore } from "~/store/timerStore";
import { formatTime } from "~/utils/formatTime";
import { Play, Square, TimerReset } from "lucide-react";
import { cn } from "~/lib/utils";
import { Skeleton } from "./ui/skeleton";

export default function TaskTimer({
  taskId,
  onComplete,
}: {
  taskId: number;
  onComplete?: () => void;
}) {
  const {
    timers,
    startTimer,
    pauseTimer,
    resetTimer,
    activeTaskId,
    getRemaining,
  } = useTimerStore();
  const t = timers[taskId] ?? {
    taskId,
    timeLeft: 25 * 60,
    duration: 25 * 60,
    isRunning: false,
  };

  // local state for display — computed from real time
  const [displayRemaining, setDisplayRemaining] = useState<number>(() => {
    return getRemaining(taskId);
  });
  const [hydrated, setHydrated] = useState(false);

  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const isAnotherRunning =
    activeTaskId !== undefined &&
    activeTaskId !== null &&
    activeTaskId !== taskId;

  useEffect(() => {
    setHydrated(true);
    // Always keep displayRemaining in sync when store changes (start/pause/reset)
    setDisplayRemaining(getRemaining(taskId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    timers[taskId]?.isRunning,
    timers[taskId]?.startedAt,
    timers[taskId]?.timeLeft,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    // If not running, nothing to schedule
    if (!t.isRunning || !t.startedAt) {
      // ensure any scheduled timers are cleared
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = () => {
      // compute accurate remaining using wall clock
      const elapsed = Math.floor(
        (Date.now() - (t.startedAt ?? Date.now())) / 1000,
      );
      const remaining = Math.max((t.timeLeft ?? t.duration) - elapsed, 0);
      setDisplayRemaining(remaining);

      if (remaining <= 0) {
        pauseTimer(taskId);

        // 🔔 optional: play audio + send browser notification
        try {
          new Audio("/notify.wav").play();
          if (Notification.permission === "granted") {
            new Notification("Pomodoro complete! Take a break ☕");
          }
        } catch {}

        // ✅ call onComplete() if provided
        onComplete?.();

        return;
      }

      // schedule next tick exactly at the next second boundary to avoid drift:
      const msNow = Date.now();
      const msUntilNextSecond = 1000 - (msNow % 1000) + 3; // +3ms guard
      timeoutRef.current = window.setTimeout(() => {
        // Using requestAnimationFrame for smoother update timing close to repaint
        rafRef.current = requestAnimationFrame(() => {
          tick();
        });
      }, msUntilNextSecond);
    };

    tick();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // we only want to re-run when the running state or startedAt changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, t.isRunning, t.startedAt]);

  if (!hydrated) {
    // Render a placeholder to match server-side markup (no mismatch)
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="bg-background h-4 w-10 mr-4" />
        <Skeleton className="w-4 h-4 bg-background" />
        <Skeleton className="w-4 h-4 bg-background" />
      </div>
    );
  }

  function setStartTime(taskId: number, duration: number) {
    new Audio("/notify.wav").play();
    startTimer(taskId, duration);
  }

  function setPauseTimer(taskId: number) {
    new Audio("/notify-2.wav").play();
    pauseTimer(taskId);
  }

  return (
    <div className="flex items-center gap-2">
      {t.isRunning ? (
        <button
          onClick={() => setPauseTimer(taskId)}
          className={cn(
            "bg-yellow-500 rounded-full p-1 text-white hover:bg-yellow-600 hover:text-white cursor-pointer",
          )}
        >
          <Square className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={() => setStartTime(taskId, t.duration)}
          disabled={isAnotherRunning}
          className={cn(
            `text-white hover:bg-green-700 rounded-full p-1 cursor-pointer dark:hover:bg-green-700 hover:text-white ${isAnotherRunning ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 dark:bg-green-600"}`,
          )}
        >
          <Play className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={() => resetTimer(taskId)}
        className={cn(
          "cursor-pointer bg-primary p-1 rounded-full hover:bg-primary/90",
        )}
      >
        <TimerReset className="h-4 w-4" />
      </button>
      <div className="w-20 text-center font-mono">
        {formatTime(displayRemaining)}
      </div>
    </div>
  );
}

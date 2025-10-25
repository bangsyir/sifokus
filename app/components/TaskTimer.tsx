// app/components/TaskTimer.tsx
import { useEffect, useRef, useState } from "react";
import { useTimerStore } from "~/store/timerStore";
import { formatTime } from "~/utils/formatTime";

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

  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const isAnotherRunning =
    activeTaskId !== undefined &&
    activeTaskId !== null &&
    activeTaskId !== taskId;

  useEffect(() => {
    // Always keep displayRemaining in sync when store changes (start/pause/reset)
    setDisplayRemaining(getRemaining(taskId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    timers[taskId]?.isRunning,
    timers[taskId]?.startedAt,
    timers[taskId]?.timeLeft,
  ]);

  useEffect(() => {
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

    let mounted = true;

    const tick = () => {
      if (!mounted) return;

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
          new Audio("/notify.mp3").play();
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
      mounted = false;
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
  }, [t.isRunning, t.startedAt]);

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 text-center font-mono">
        {formatTime(displayRemaining)}
      </div>

      {t.isRunning ? (
        <button
          onClick={() => pauseTimer(taskId)}
          className="px-2 py-1 rounded bg-yellow-500 text-white"
        >
          Pause
        </button>
      ) : (
        <button
          onClick={() => startTimer(taskId, t.duration)}
          disabled={isAnotherRunning}
          className={`px-2 py-1 rounded text-white ${isAnotherRunning ? "bg-gray-300 cursor-not-allowed" : "bg-green-600"}`}
        >
          Start
        </button>
      )}

      <button
        onClick={() => resetTimer(taskId)}
        className="px-2 py-1 rounded bg-gray-600 text-white"
      >
        Reset
      </button>
    </div>
  );
}

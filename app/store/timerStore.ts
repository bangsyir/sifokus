// app/store/timerStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Timer = {
  taskId: string;
  timeLeft: number; // seconds remaining when paused or initial duration
  duration: number; // configured duration in seconds (default 25*60)
  isRunning: boolean;
  startedAt?: number; // ms timestamp (Date.now()) when started
};

type TimerState = {
  timers: Record<string, Timer>;
  activeTaskId?: string | null;
  startTimer: (taskId: string, duration?: number) => void;
  pauseTimer: (taskId: string) => void;
  resetTimer: (taskId: string) => void;
  // optional: getRemaining helper (not persisted)
  getRemaining: (taskId: string) => number;
};

const DEFAULT_DURATION = 25 * 60;

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      timers: {},
      activeTaskId: null,

      startTimer: (taskId, duration = DEFAULT_DURATION) => {
        const state = get();
        // pause other active task if exists
        if (state.activeTaskId && state.activeTaskId !== taskId) {
          get().pauseTimer(state.activeTaskId);
        }

        const existing = state.timers[taskId];
        const baseDuration = existing?.duration ?? duration;
        const baseTimeLeft = existing?.timeLeft ?? baseDuration;

        // If already running, do nothing
        if (existing?.isRunning) return;

        const startedAt = Date.now();

        set((s) => ({
          activeTaskId: taskId,
          timers: {
            ...s.timers,
            [taskId]: {
              taskId,
              duration: baseDuration,
              timeLeft: baseTimeLeft, // store original remaining, actual remaining computed by TaskTimer
              isRunning: true,
              startedAt,
            },
          },
        }));
      },

      pauseTimer: (taskId) => {
        const state = get();
        const t = state.timers[taskId];
        if (!t) return;

        // compute elapsed seconds since startedAt
        if (t.isRunning && t.startedAt) {
          const elapsed = Math.floor((Date.now() - t.startedAt) / 1000);
          const remaining = Math.max((t.timeLeft ?? t.duration) - elapsed, 0);

          set((s) => ({
            activeTaskId: s.activeTaskId === taskId ? null : s.activeTaskId,
            timers: {
              ...s.timers,
              [taskId]: {
                ...t,
                isRunning: false,
                startedAt: undefined,
                timeLeft: remaining,
              },
            },
          }));
        } else {
          // not running => just clear startedAt flag
          set((s) => ({
            activeTaskId: s.activeTaskId === taskId ? null : s.activeTaskId,
            timers: {
              ...s.timers,
              [taskId]: { ...t, isRunning: false, startedAt: undefined },
            },
          }));
        }
      },

      resetTimer: (taskId) => {
        const state = get();
        const t = state.timers[taskId];
        const dur = t?.duration ?? DEFAULT_DURATION;
        set((s) => ({
          activeTaskId: s.activeTaskId === taskId ? null : s.activeTaskId,
          timers: {
            ...s.timers,
            [taskId]: {
              taskId,
              timeLeft: dur,
              duration: dur,
              isRunning: false,
              startedAt: undefined,
            },
          },
        }));
      },

      getRemaining: (taskId) => {
        const t = get().timers[taskId];
        if (!t) return DEFAULT_DURATION;
        if (!t.isRunning || !t.startedAt) return t.timeLeft ?? t.duration;
        const elapsed = Math.floor((Date.now() - t.startedAt) / 1000);
        return Math.max((t.timeLeft ?? t.duration) - elapsed, 0);
      },
    }),
    {
      name: "pomodoro-timers-v2", // localStorage key
    },
  ),
);

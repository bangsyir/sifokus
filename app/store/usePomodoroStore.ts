import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SessionType = "focus" | "short_break" | "long_break";
export type SessionStatus = "idle" | "running" | "paused" | "completed";

interface PomodoroStore {
  activeTaskId: string | null;
  remainingTime: number;
  sessionType: SessionType;
  sessionStatus: SessionStatus;
  cyclesCount: number;

  selectTask: (id: string, cyclesCount: number) => void;
  startTask: () => void;
  pauseTask: (id: string) => void;
  resumeTask: () => void;
  // completeSession: () => void;
  nextSession: () => void;
  resetTask: (id: string) => void;
  setSessionType: (type: SessionType) => void;
  tick: () => void;
  clearTimer: () => void;
  resetAll: () => void;
}

const DEFAULT_FOCUS = 25 * 60;
const DEFAULT_SHORT_BREAK = 5 * 60;
const DEFAULT_LONG_BREAK = 30 * 60;

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    (set, get) => ({
      activeTaskId: null,
      remainingTime: DEFAULT_FOCUS,
      sessionType: "focus",
      sessionStatus: "idle",
      cyclesCount: 0,

      selectTask: (id, cyclesCount) => {
        set({
          activeTaskId: id,
          remainingTime: DEFAULT_FOCUS,
          sessionType: "focus",
          sessionStatus: "idle",
          cyclesCount: cyclesCount,
        });
      },

      startTask: () => {
        const { sessionType, cyclesCount } = get();
        if (cyclesCount >= 4 && sessionType === "focus") {
          set({
            sessionStatus: "running",
            cyclesCount: 0,
          });
        }
        set({
          sessionStatus: "running",
        });
      },

      pauseTask: () => {
        set({
          sessionStatus: "paused",
        });
      },

      resumeTask: () => {
        set({
          sessionStatus: "running",
          // intervalId: timer,
        });
      },

      tick: () => {
        const { activeTaskId, remainingTime } = get();
        if (!activeTaskId) return set({});

        if (remainingTime <= 1) {
          get().nextSession();
          new Audio("ta-da.mp3").play();
          return;
        }
        set({ remainingTime: remainingTime - 1 });
      },

      nextSession: () => {
        const { cyclesCount, sessionType } = get();
        let nextType: SessionType = "focus";
        let nextTime = DEFAULT_FOCUS;
        let nextCycles = cyclesCount;

        if (sessionType === "focus") {
          nextCycles += 1;
          if (nextCycles >= 4) {
            nextType = "long_break";
            nextTime = DEFAULT_LONG_BREAK;
          } else {
            nextType = "short_break";
            nextTime = DEFAULT_SHORT_BREAK;
          }
        } else {
          nextType = "focus";
          nextTime = DEFAULT_FOCUS;
        }
        set({
          sessionType: nextType,
          remainingTime: nextTime,
          sessionStatus: "idle",
          cyclesCount: nextCycles,
        });
      },

      resetTask: () => {
        set({
          sessionType: "focus",
          remainingTime: DEFAULT_FOCUS,
          sessionStatus: "idle",
        });
      },
      setSessionType: (type) => {
        let newTime = DEFAULT_FOCUS;
        if (type === "short_break") newTime = DEFAULT_SHORT_BREAK;
        if (type === "long_break") newTime = DEFAULT_LONG_BREAK;

        set({
          sessionType: type,
          remainingTime: newTime,
          sessionStatus: "idle",
        });
      },

      clearTimer: () => {
        set({});
      },

      resetAll: () => {
        set({
          activeTaskId: null,
        });
      },
    }),
    {
      name: "pomodoro-multi-task",
      partialize: (s) => ({
        activeTaskId: s.activeTaskId,
        remainingTime: s.remainingTime,
        sessionType: s.sessionType,
        sessionStatus: s.sessionStatus,
        cyclesCount: s.cyclesCount,
      }),
    },
  ),
);

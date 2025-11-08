import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tasks } from "~/db/schema";

export type SessionType = "focus" | "short_break" | "long_break";
export type SessionStatus = "idle" | "running" | "paused" | "completed";

interface Tasktask {
  id: string;
  title: string;
  remainingTime: number;
  sessionType: SessionType;
  sessionStatus: SessionStatus;
  cycleCount: number;
}

interface PomodoroStore {
  activeTaskId: string | null;
  tasks: Record<string, Tasktask>;
  intervalId: number | null;

  selectTask: (id: string, title: string, cyclesCount: number) => void;
  startTask: () => void;
  pauseTask: () => void;
  resumeTask: () => void;
  // completeSession: () => void;
  nextSession: () => void;
  resetTask: () => void;
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
      tasks: {},
      intervalId: null,
      selectTask: (id, title, cyclesCount) => {
        const state = get();
        const existing = state.tasks[id];
        if (existing) {
          set({
            activeTaskId: id,
            tasks: {
              ...state.tasks,
              [id]: {
                ...existing,
                cycleCount: cyclesCount,
              },
            },
          });
          return;
        }
        set({
          activeTaskId: id,
          tasks: {
            ...state.tasks,
            [id]: {
              id: id,
              title: title,
              remainingTime: DEFAULT_FOCUS,
              sessionType: "focus",
              sessionStatus: "idle",
              cycleCount: cyclesCount,
            },
          },
        });
      },

      startTask: () => {
        const { activeTaskId, tasks } = get();
        if (!activeTaskId) return;
        const task = tasks[activeTaskId];

        const timer = window.setInterval(() => get().tick(), 1000);
        if (task.cycleCount >= 4 && task.sessionType === "focus") {
          set({
            intervalId: timer,
            tasks: {
              [activeTaskId]: {
                ...task,
                sessionStatus: "running",
                cycleCount: 0,
              },
            },
          });
        }
        set({
          intervalId: timer,
          tasks: {
            ...tasks,
            [activeTaskId]: {
              ...task,
              sessionStatus: "running",
            },
          },
        });
      },

      pauseTask: () => {
        const { intervalId, activeTaskId, tasks } = get();
        if (!activeTaskId) return;
        if (intervalId) clearInterval(intervalId);
        const task = tasks[activeTaskId];
        set({
          intervalId: null,
          tasks: {
            ...tasks,
            [activeTaskId]: {
              ...task,
              sessionStatus: "paused",
            },
          },
        });
      },

      resumeTask: () => {
        const { activeTaskId, tasks, intervalId } = get();
        if (!activeTaskId || intervalId) return;
        const timer = window.setInterval(() => get().tick(), 1000);
        const task = tasks[activeTaskId];
        set({
          intervalId: timer,
          tasks: {
            ...tasks,
            [activeTaskId]: {
              ...task,
              sessionStatus: "running",
            },
          },
          // intervalId: task,
        });
      },

      tick: () => {
        const { activeTaskId, tasks } = get();
        if (!activeTaskId) return;
        const task = tasks[activeTaskId];

        if (task.remainingTime <= 1) {
          get().nextSession();
          new Audio("ta-da.mp3").play();
          return;
        }
        set({
          tasks: {
            ...tasks,
            [activeTaskId]: {
              ...task,
              remainingTime: task.remainingTime - 1,
            },
          },
        });
      },

      nextSession: () => {
        const { activeTaskId, tasks, intervalId } = get();
        if (!activeTaskId) return;
        if (intervalId) clearInterval(intervalId);

        const task = tasks[activeTaskId];
        let nextType: SessionType = "focus";
        let nextTime = DEFAULT_FOCUS;
        let nextCycles = task.cycleCount;

        if (task.sessionType === "focus") {
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
          tasks: {
            ...tasks,
            [activeTaskId]: {
              ...task,
              sessionType: nextType,
              remainingTime: nextTime,
              sessionStatus: "idle",
              cycleCount: nextCycles,
            },
          },
        });
      },

      resetTask: () => {
        const { activeTaskId, tasks } = get();
        if (!activeTaskId) return;
        const task = tasks[activeTaskId];

        set({
          tasks: {
            ...tasks,
            [activeTaskId]: {
              ...task,
              sessionType: "focus",
              remainingTime: DEFAULT_FOCUS,
              sessionStatus: "idle",
            },
          },
        });
      },
      setSessionType: (type) => {
        let newTime = DEFAULT_FOCUS;
        if (type === "short_break") newTime = DEFAULT_SHORT_BREAK;
        if (type === "long_break") newTime = DEFAULT_LONG_BREAK;
        const { activeTaskId, tasks } = get();
        if (!activeTaskId) return;
        const task = tasks[activeTaskId];

        set({
          tasks: {
            ...tasks,
            [activeTaskId]: {
              ...task,
              sessionType: type,
              remainingTime: newTime,
              sessionStatus: "idle",
            },
          },
        });
      },

      clearTimer: () => {
        const { intervalId } = get();
        if (intervalId) clearInterval(intervalId);
        set({
          intervalId: null,
        });
      },

      resetAll: () => {
        const { intervalId } = get();
        if (intervalId) clearInterval(intervalId);
        set({
          activeTaskId: null,
          tasks: {},
          intervalId: null,
        });
      },
    }),
    {
      name: "pomodoro-multi-task",
      partialize: (s) => ({
        activeTaskId: s.activeTaskId,
        tasks: s.tasks,
        intervalId: s.intervalId,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) console.error("Pomodoro rehydrate failed", error);
        if (!state) return;

        // Wait until rehydrated, then resume if needed
        setTimeout(() => {
          const current = usePomodoroStore.getState();
          const activeId = current.activeTaskId;
          if (!activeId) return;

          const activeTask = current.tasks[activeId];
          if (activeTask?.sessionStatus === "running") {
            const timer = window.setInterval(() => {
              usePomodoroStore.getState().tick();
            }, 1000);
            current.intervalId = timer;
          }
        }, 0);
      },
    },
  ),
);

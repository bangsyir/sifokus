// app/db/schema.ts
import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pomodoroSessions = pgTable("pomodoro_sessions", {
  id: serial("id").primaryKey(),
  duration: integer("duration").notNull(),
  startedAt: integer("started_at").notNull(),
  completedAt: integer("completed_at"),
  taskId: integer("task_id").notNull(),
});

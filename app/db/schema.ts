// app/db/schema.ts
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  boolean,
  index,
} from "drizzle-orm/pg-core";

import { v7 as uuidv7 } from "uuid";

export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    fullname: text("full_name"),
    username: text("username"),
    email: text("email"),
    emailVerified: timestamp("email_verified", {
      withTimezone: true,
      mode: "date",
      precision: 3,
    }),
    image: text("image"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
      precision: 3,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("user_id_idx").on(table.id),
    index("user_username_idx").on(table.username),
    index("user_email_idx").on(table.email),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  tasks: many(tasks),
}));

export const sessions = pgTable(
  "session",
  {
    token: text("token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
      mode: "date",
      precision: 3,
    }),
    expiresAt: timestamp("expires_at", {
      precision: 3,
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (sessions) => [
    index("session_token_idx").on(sessions.token),
    index("session_user_id_idx").on(sessions.userId),
  ],
);
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").default("pending"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
      precision: 3,
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
      precision: 3,
    })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (tasks) => [
    // 1. Index for fetching tasks by user (FK lookup)
    index("task_user_id_idx").on(tasks.userId),
    // 2. Index for filtering by status
    index("task_status_idx").on(tasks.status),
    // 3. Composite Index for dashboard view: active tasks for a user
    index("task_user_status_idx").on(tasks.userId, tasks.status),
  ],
);

// Relations for Tasks
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  sessions: many(taskSessions),
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

export const taskSessions = pgTable(
  "task_sessions",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"), // Null if the session hasn't finished
    durationMinutes: integer("duration_minutes").default(25).notNull(), // Can be adjusted, default 25
    isCompleted: boolean("is_completed").default(false).notNull(), // True if the full 25 min ran OR task was completed
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "date",
      precision: 3,
    }), // Timestamp when the session was marked done (success or task complete)
    interrupted: boolean("interrupted").default(false).notNull(), // True if user clicked stop before the timer finished
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
      precision: 3,
    })
      .defaultNow()
      .notNull(),
  },
  (sessions) => [
    // 1. Index for task lookups (FK)
    index("session_task_id_idx").on(sessions.taskId),

    // 2. Index for finding the latest session quickly
    index("session_start_time_idx").on(sessions.startTime),

    // 3. Index for status/analytics
    index("session_is_completed_idx").on(sessions.isCompleted),
  ],
);

// Relations for Sessions
export const taskSessionsRelations = relations(taskSessions, ({ one }) => ({
  task: one(tasks, {
    fields: [taskSessions.taskId],
    references: [tasks.id],
  }),
}));

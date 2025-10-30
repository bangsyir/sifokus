// app/db/schema.ts
import { Provider } from "@radix-ui/react-tooltip";
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  boolean,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

import { v7 as uuidv7 } from "uuid";

// --- ENUMS ---
export const sessionTypeEnum = pgEnum("session_type", [
  "work",
  "short_break",
  "long_break",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "running",
  "paused",
  "completed",
  "cancelled",
]);

export const cycleStatusEnum = pgEnum("cycle_status", [
  "active",
  "completed",
  "abandoned",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    fullname: text("full_name"),
    username: text("username").unique(),
    email: text("email").unique(),
    emailVerified: timestamp("email_verified", {
      withTimezone: true,
      mode: "date",
      precision: 3,
    }),
    image: text("image"),
    role: text("role").default("user"),
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
    uniqueIndex("user_username_idx").on(table.username),
    uniqueIndex("user_email_idx").on(table.email),
  ],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  tasks: many(tasks),
  taskCycles: many(taskCycles),
  provider: one(userProviders),
}));

export const userProviders = pgTable(
  "user_providers",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerId: text("provider_id").notNull(),
    email: text("email"),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_provider_id").on(table.provider, table.providerId),
    index("user_providers_user_id_idx").on(table.userId),
  ],
);

export const userProvidersRelations = relations(userProviders, ({ one }) => ({
  user: one(users, {
    fields: [userProviders.userId],
    references: [users.id],
  }),
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
    totalCycle: integer("total_cycle").default(0).notNull(),
    totalSession: integer("total_session").default(0).notNull(),
    completed: boolean("completed").default(false).notNull(),
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
    index("task_status_idx").on(tasks.completed),
    index("tasks_created_at_idx").on(tasks.createdAt),
    // 3. Composite Index for dashboard view: active tasks for a user
    index("task_user_status_idx").on(tasks.userId, tasks.completed),
  ],
);

// Relations for Tasks
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  sessions: many(taskSessions),
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  cycle: many(taskCycles),
}));

export const taskCycles = pgTable(
  "task_cycles",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    taskId: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    status: cycleStatusEnum("status").default("active").notNull(),
    completedSessions: integer("completed_sessions").default(0).notNull(),
    startedAt: timestamp("started_at", {
      withTimezone: true,
      mode: "date",
      precision: 3,
    }),
    endAt: timestamp("end_at", {
      withTimezone: true,
      mode: "date",
      precision: 3,
    }),
  },
  (taskCycles) => [
    index("task_cycles_user_id_idx").on(taskCycles.userId),
    index("task_cycles_task_id_idx").on(taskCycles.taskId),
    index("task_cycles_status_idx").on(taskCycles.status),
    index("task_cycles_started_at_idx").on(taskCycles.startedAt),
  ],
);

export const taskCyclesRelations = relations(taskCycles, ({ one, many }) => ({
  tasks: one(tasks, { fields: [taskCycles.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskCycles.userId], references: [users.id] }),
  sessions: many(taskSessions),
}));

export const taskSessions = pgTable(
  "task_sessions",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    cycleId: uuid("cycle_id").references(() => taskCycles.id, {
      onDelete: "cascade",
    }),
    type: sessionTypeEnum("type").notNull(),
    status: sessionStatusEnum("status").default("running").notNull(),
    duration: integer("duration").notNull(), // Can be adjusted, default seconds 25 * 60
    startedAt: timestamp("start_time", {
      withTimezone: true,
      mode: "date",
      precision: 3,
    }),
    endedAt: timestamp("end_at", {
      withTimezone: true,
      mode: "date",
      precision: 3,
    }), // Timestamp when the session was marked done (success or task complete)
    completed: boolean("completed").default(false).notNull(), // True if the full 25 min ran OR task was completed
  },
  (sessions) => [
    index("session_task_id_idx").on(sessions.taskId),
    index("session_is_completed_idx").on(sessions.completed),
    index("task_sessions_type_idx").on(sessions.type),
    index("session_start_at_idx").on(sessions.startedAt),
    index("task_sessions_ended_at_idx").on(sessions.endedAt),
    index("task_sessions_user_completed_endedat_idx").on(
      sessions.userId,
      sessions.completed,
      sessions.endedAt,
    ),
  ],
);

// Relations for Sessions
export const taskSessionsRelations = relations(taskSessions, ({ one }) => ({
  task: one(tasks, {
    fields: [taskSessions.taskId],
    references: [tasks.id],
  }),
  user: one(users, { fields: [taskSessions.userId], references: [users.id] }),
  cycle: one(taskCycles, {
    fields: [taskSessions.cycleId],
    references: [taskCycles.id],
  }),
}));

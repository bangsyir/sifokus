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
} from "drizzle-orm/pg-core";

import { v7 as uuidv7 } from "uuid";

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
    duration: integer("duration").notNull(), // Can be adjusted, default seconds 25 * 60
    isCompleted: boolean("is_completed").default(false).notNull(), // True if the full 25 min ran OR task was completed
    startAt: timestamp("start_time", {
      withTimezone: true,
      mode: "date",
      precision: 3,
    }),
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
    index("session_start_at_idx").on(sessions.startAt),

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

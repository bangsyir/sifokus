CREATE TABLE "pomodoro_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"duration" integer NOT NULL,
	"started_at" integer NOT NULL,
	"completed_at" integer,
	"task_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL
);

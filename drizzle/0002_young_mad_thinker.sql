CREATE TYPE "public"."cycle_status" AS ENUM('active', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('running', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."session_type" AS ENUM('work', 'short_break', 'long_break');--> statement-breakpoint
CREATE TABLE "task_cycles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"status" "cycle_status" DEFAULT 'active' NOT NULL,
	"completed_sessions" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp (3) with time zone,
	"end_at" timestamp (3) with time zone
);
--> statement-breakpoint
ALTER TABLE "task_sessions" RENAME COLUMN "is_completed" TO "completed";--> statement-breakpoint
DROP INDEX "session_is_completed_idx";--> statement-breakpoint
DROP INDEX "task_status_idx";--> statement-breakpoint
DROP INDEX "task_user_status_idx";--> statement-breakpoint
ALTER TABLE "task_sessions" ADD COLUMN "userId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "task_sessions" ADD COLUMN "cycle_id" uuid;--> statement-breakpoint
ALTER TABLE "task_sessions" ADD COLUMN "type" "session_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "task_sessions" ADD COLUMN "status" "session_status" DEFAULT 'running' NOT NULL;--> statement-breakpoint
ALTER TABLE "task_sessions" ADD COLUMN "end_at" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "total_cycle" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "total_session" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "task_cycles" ADD CONSTRAINT "task_cycles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_cycles" ADD CONSTRAINT "task_cycles_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_cycles_user_id_idx" ON "task_cycles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "task_cycles_task_id_idx" ON "task_cycles" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_cycles_status_idx" ON "task_cycles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "task_cycles_started_at_idx" ON "task_cycles" USING btree ("started_at");--> statement-breakpoint
ALTER TABLE "task_sessions" ADD CONSTRAINT "task_sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_sessions" ADD CONSTRAINT "task_sessions_cycle_id_task_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."task_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_sessions_type_idx" ON "task_sessions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "task_sessions_ended_at_idx" ON "task_sessions" USING btree ("end_at");--> statement-breakpoint
CREATE INDEX "task_sessions_user_completed_endedat_idx" ON "task_sessions" USING btree ("userId","completed","end_at");--> statement-breakpoint
CREATE INDEX "tasks_created_at_idx" ON "tasks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "session_is_completed_idx" ON "task_sessions" USING btree ("completed");--> statement-breakpoint
CREATE INDEX "task_status_idx" ON "tasks" USING btree ("completed");--> statement-breakpoint
CREATE INDEX "task_user_status_idx" ON "tasks" USING btree ("userId","completed");--> statement-breakpoint
ALTER TABLE "task_sessions" DROP COLUMN "completed_at";--> statement-breakpoint
ALTER TABLE "task_sessions" DROP COLUMN "interrupted";--> statement-breakpoint
ALTER TABLE "task_sessions" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "status";
CREATE TABLE "session" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"revoked_at" timestamp (3) with time zone,
	"expires_at" timestamp (3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"task_id" uuid NOT NULL,
	"duration" integer NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"start_time" timestamp (3) with time zone NOT NULL,
	"completed_at" timestamp (3) with time zone,
	"interrupted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_providers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_id" text NOT NULL,
	"email" text,
	"name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"username" text,
	"email" text,
	"email_verified" timestamp (3) with time zone,
	"image" text,
	"role" text DEFAULT 'user',
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_sessions" ADD CONSTRAINT "task_sessions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_providers" ADD CONSTRAINT "user_providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_task_id_idx" ON "task_sessions" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "session_start_at_idx" ON "task_sessions" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "session_is_completed_idx" ON "task_sessions" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "task_user_id_idx" ON "tasks" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "task_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "task_user_status_idx" ON "tasks" USING btree ("userId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_provider_id" ON "user_providers" USING btree ("provider","provider_id");--> statement-breakpoint
CREATE INDEX "user_providers_user_id_idx" ON "user_providers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "users" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "users" USING btree ("email");
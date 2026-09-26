CREATE TYPE "public"."routine_report_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "routine_slot_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid,
	"reported_by" uuid,
	"message" text NOT NULL,
	"suggested_class_code" text,
	"suggested_teacher_initial" text,
	"suggested_room" text,
	"snapshot_batch" text,
	"snapshot_section" text,
	"snapshot_day" text,
	"snapshot_start_period" integer,
	"snapshot_class_code" text,
	"snapshot_teacher_initial" text,
	"snapshot_room" text,
	"status" "routine_report_status" DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "routine_slot_reports" ADD CONSTRAINT "routine_slot_reports_slot_id_routine_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."routine_slots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_slot_reports" ADD CONSTRAINT "routine_slot_reports_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_slot_reports" ADD CONSTRAINT "routine_slot_reports_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_routine_reports_status" ON "routine_slot_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_routine_reports_slot_id" ON "routine_slot_reports" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX "idx_routine_reports_reported_by" ON "routine_slot_reports" USING btree ("reported_by");
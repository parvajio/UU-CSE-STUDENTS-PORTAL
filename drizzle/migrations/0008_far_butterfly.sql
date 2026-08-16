CREATE TABLE "binary26_gallery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"image_url" text NOT NULL,
	"year" text NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "binary26_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ticket_number" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"batch" text NOT NULL,
	"section" text NOT NULL,
	"pickup_point" text NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"marked_paid_by" uuid,
	"marked_paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "binary26_registrations_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "routine_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch" text NOT NULL,
	"section" text NOT NULL,
	"day" text NOT NULL,
	"start_period" integer,
	"end_period" integer,
	"start_time" text,
	"end_time" text,
	"class_code" text NOT NULL,
	"course_title" text,
	"teacher_initial" text,
	"room" text,
	"is_lab" boolean DEFAULT false NOT NULL,
	"semester" text,
	"effective_from" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "is_custom" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "binary26_registrations" ADD CONSTRAINT "binary26_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "binary26_registrations" ADD CONSTRAINT "binary26_registrations_marked_paid_by_users_id_fk" FOREIGN KEY ("marked_paid_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
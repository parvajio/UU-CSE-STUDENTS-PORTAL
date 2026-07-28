CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "public"."auth_provider" AS ENUM('credentials', 'google', 'unclaimed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'moderator', 'admin');--> statement-breakpoint
CREATE TYPE "public"."profile_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"auth_provider" "auth_provider" NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"student_id" text,
	"batch_number" integer NOT NULL,
	"section" text NOT NULL,
	"avatar_url" text,
	"bio" text,
	"facebook_url" text,
	"linkedin_url" text,
	"whatsapp_number" text,
	"portfolio_url" text,
	"github_url" text,
	"is_alumni" boolean DEFAULT false NOT NULL,
	"current_company" text,
	"job_position" text,
	"status" "profile_status" DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "profiles_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_skill_id" uuid,
	"color_key" text,
	CONSTRAINT "skills_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "profile_skills" (
	"profile_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "profile_skills_profile_id_skill_id_pk" PRIMARY KEY("profile_id","skill_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_parent_skill_id_skills_id_fk" FOREIGN KEY ("parent_skill_id") REFERENCES "public"."skills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_skills" ADD CONSTRAINT "profile_skills_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_skills" ADD CONSTRAINT "profile_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_profiles_fullname_trgm" ON "profiles" USING gin ("full_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_profiles_batch" ON "profiles" USING btree ("batch_number");--> statement-breakpoint
CREATE INDEX "idx_profiles_status_alumni" ON "profiles" USING btree ("status","is_alumni");
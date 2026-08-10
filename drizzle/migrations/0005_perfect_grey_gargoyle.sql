CREATE TYPE "public"."question_program_type" AS ENUM('regular', 'diploma', 'evening');--> statement-breakpoint
CREATE TYPE "public"."question_season" AS ENUM('summer', 'fall', 'spring');--> statement-breakpoint
CREATE TYPE "public"."question_file_type" AS ENUM('image', 'pdf');--> statement-breakpoint
CREATE TABLE "question_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"file_type" "question_file_type" NOT NULL,
	"order_" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Two-step data move (manual edit, pg_trgm precedent): preserve the existing
-- question row's file reference by copying file_url into question_files BEFORE
-- the column is dropped. file_type is inferred from the URL extension; images
-- get order 0 (pdf is always a single row).
INSERT INTO question_files (question_id, file_url, file_type, order_) SELECT id, file_url, CASE WHEN file_url ~* '\.(png|jpe?g|webp|gif)$' THEN 'image'::question_file_type ELSE 'pdf'::question_file_type END, 0 FROM questions WHERE file_url IS NOT NULL AND file_url <> '';--> statement-breakpoint
CREATE TABLE "question_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- subjects removed only after its dependent objects on courses are dropped
-- (manual reorder: drizzle emitted DROP TABLE ... CASCADE before the FK drop).
ALTER TABLE "courses" DROP CONSTRAINT "courses_subject_id_subjects_id_fk";--> statement-breakpoint
DROP INDEX "idx_courses_subject_id";--> statement-breakpoint
ALTER TABLE "subjects" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "subjects";--> statement-breakpoint
DROP INDEX "idx_questions_program_evening";--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "course_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "program_type" "question_program_type" DEFAULT 'regular' NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "season" "question_season";--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "teacher_name" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "download_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "question_files" ADD CONSTRAINT "question_files_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_likes" ADD CONSTRAINT "question_likes_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_likes" ADD CONSTRAINT "question_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_question_files_question_order" ON "question_files" USING btree ("question_id","order_");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_question_likes_question_user" ON "question_likes" USING btree ("question_id","user_id");--> statement-breakpoint
ALTER TABLE "courses" DROP COLUMN "subject_id";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "custom_subject";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "custom_course";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "program";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "evening";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "file_url";--> statement-breakpoint
DROP TYPE "public"."question_program";
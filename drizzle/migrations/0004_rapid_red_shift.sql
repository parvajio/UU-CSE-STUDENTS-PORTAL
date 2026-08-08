CREATE TYPE "public"."question_exam_type" AS ENUM('previous_year', 'midterm', 'final', 'lab', 'viva');--> statement-breakpoint
CREATE TYPE "public"."question_program" AS ENUM('regular', 'diploma');--> statement-breakpoint
CREATE TYPE "public"."question_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"credit_hours" numeric NOT NULL,
	"subject_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subjects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"title_tsv" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "title")) STORED NOT NULL,
	"course_id" uuid,
	"custom_subject" text,
	"custom_course" text,
	"batch_number" integer NOT NULL,
	"program" "question_program" DEFAULT 'regular' NOT NULL,
	"evening" boolean DEFAULT false NOT NULL,
	"exam_type" "question_exam_type" NOT NULL,
	"file_url" text NOT NULL,
	"uploaded_by" uuid,
	"status" "question_status" DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"tag" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_courses_subject_id" ON "courses" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "idx_questions_title_tsv" ON "questions" USING gin ("title_tsv");--> statement-breakpoint
CREATE INDEX "idx_questions_status_batch" ON "questions" USING btree ("status","batch_number");--> statement-breakpoint
CREATE INDEX "idx_questions_course_id" ON "questions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_questions_exam_type" ON "questions" USING btree ("exam_type");--> statement-breakpoint
CREATE INDEX "idx_questions_program_evening" ON "questions" USING btree ("program","evening");--> statement-breakpoint
CREATE INDEX "idx_questions_uploaded_by" ON "questions" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_question_tags_tag" ON "question_tags" USING btree ("tag");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_question_tags_question_tag" ON "question_tags" USING btree ("question_id","tag");
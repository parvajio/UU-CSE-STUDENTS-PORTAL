DROP INDEX "idx_questions_title_tsv";--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "title_tsv";
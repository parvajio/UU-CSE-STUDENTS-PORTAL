ALTER TABLE "club_members" ALTER COLUMN "profile_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "club_members" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_club_members_club_user_unique" ON "club_members" USING btree ("club_id","user_id");--> statement-breakpoint
ALTER TABLE "club_members" ADD CONSTRAINT "chk_club_members_user_or_profile" CHECK ("club_members"."user_id" IS NOT NULL OR "club_members"."profile_id" IS NOT NULL);
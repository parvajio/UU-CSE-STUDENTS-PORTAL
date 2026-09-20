CREATE TABLE IF NOT EXISTS "binary26_payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"action" text NOT NULL,
	"actor_id" uuid,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "binary26_payment_events" ADD CONSTRAINT "binary26_payment_events_registration_id_binary26_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."binary26_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "binary26_payment_events" ADD CONSTRAINT "binary26_payment_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
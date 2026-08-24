-- pg_trgm powers the typo-tolerant catalogue search. It must exist before
-- the GIN index below, and drizzle-kit does not emit extension statements.
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TABLE "book_edition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"cover_url" text,
	"total_pages" integer NOT NULL,
	"normalized_title" text NOT NULL,
	"normalized_author" text DEFAULT '' NOT NULL,
	"created_by" text,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "book_edition_total_pages_positive" CHECK ("book_edition"."total_pages" > 0)
);
--> statement-breakpoint
ALTER TABLE "book" ADD COLUMN "edition_id" uuid;--> statement-breakpoint
ALTER TABLE "book_edition" ADD CONSTRAINT "book_edition_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "book_edition_identity_idx" ON "book_edition" USING btree ("normalized_title","normalized_author");--> statement-breakpoint
CREATE INDEX "book_edition_title_trgm_idx" ON "book_edition" USING gin ("normalized_title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "book_edition_usage_idx" ON "book_edition" USING btree ("usage_count" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "book" ADD CONSTRAINT "book_edition_id_book_edition_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."book_edition"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_edition_idx" ON "book" USING btree ("edition_id");
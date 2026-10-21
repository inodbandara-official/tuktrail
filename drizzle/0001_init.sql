CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."district" AS ENUM('colombo', 'gampaha', 'kalutara', 'kandy', 'matale', 'nuwara_eliya', 'galle', 'matara', 'hambantota', 'jaffna', 'kilinochchi', 'mannar', 'vavuniya', 'mullaitivu', 'batticaloa', 'ampara', 'trincomalee', 'kurunegala', 'puttalam', 'anuradhapura', 'polonnaruwa', 'badulla', 'monaragala', 'ratnapura', 'kegalle');--> statement-breakpoint
CREATE TYPE "public"."image_source" AS ENUM('official', 'user');--> statement-breakpoint
CREATE TYPE "public"."image_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."place_category" AS ENUM('temple', 'heritage_site', 'beach', 'waterfall', 'national_park', 'wildlife', 'viewpoint', 'hike', 'museum', 'lake', 'garden', 'other');--> statement-breakpoint
CREATE TYPE "public"."place_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."province" AS ENUM('western', 'central', 'southern', 'northern', 'eastern', 'north_western', 'north_central', 'uva', 'sabaragamuwa');--> statement-breakpoint
CREATE TYPE "public"."verification_method" AS ENUM('device', 'exif');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"submission_id" uuid,
	"variants" jsonb NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"lqip" text NOT NULL,
	"alt_text" text NOT NULL,
	"source" "image_source" NOT NULL,
	"attribution" text,
	"license" text,
	"uploaded_by" text,
	"status" "image_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"capture_lat" double precision,
	"capture_lng" double precision,
	"moderated_by" text,
	"moderated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" "place_category" NOT NULL,
	"location" geography(Point, 4326) NOT NULL,
	"visit_radius_m" integer DEFAULT 1000 NOT NULL,
	"district" "district" NOT NULL,
	"province" "province" NOT NULL,
	"short_description" varchar(280) NOT NULL,
	"full_description" text DEFAULT '' NOT NULL,
	"opening_hours" jsonb,
	"fee_foreign_lkr" integer,
	"fee_local_lkr" integer,
	"dress_code" text,
	"how_to_get_there" text,
	"best_months" smallint[] DEFAULT '{}'::smallint[] NOT NULL,
	"safety_notes" text,
	"hero_image_id" uuid,
	"is_verified" boolean DEFAULT false NOT NULL,
	"status" "place_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "places_visit_radius_positive" CHECK ("places"."visit_radius_m" > 0),
	CONSTRAINT "places_best_months_range" CHECK ("places"."best_months" <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::smallint[]),
	CONSTRAINT "places_fees_non_negative" CHECK (coalesce("places"."fee_foreign_lkr", 0) >= 0 and coalesce("places"."fee_local_lkr", 0) >= 0)
);
--> statement-breakpoint
CREATE TABLE "towns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"district" "district" NOT NULL,
	"province" "province" NOT NULL,
	"location" geography(Point, 4326) NOT NULL,
	"is_hub" boolean DEFAULT false NOT NULL,
	CONSTRAINT "towns_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "upload_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"object_key" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "upload_intents_objectKey_unique" UNIQUE("object_key")
);
--> statement-breakpoint
CREATE TABLE "upload_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"place_id" uuid NOT NULL,
	"verification_method" "verification_method" NOT NULL,
	"distance_m" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"user_id" text NOT NULL,
	"place_id" uuid NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visits_user_id_place_id_pk" PRIMARY KEY("user_id","place_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_images" ADD CONSTRAINT "place_images_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_images" ADD CONSTRAINT "place_images_submission_id_upload_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."upload_submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_images" ADD CONSTRAINT "place_images_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_images" ADD CONSTRAINT "place_images_moderated_by_user_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_intents" ADD CONSTRAINT "upload_intents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_submissions" ADD CONSTRAINT "upload_submissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_submissions" ADD CONSTRAINT "upload_submissions_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_index" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_index" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_index" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "place_images_place_id_status_index" ON "place_images" USING btree ("place_id","status");--> statement-breakpoint
CREATE INDEX "place_images_uploaded_by_index" ON "place_images" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "place_images_status_created_at_index" ON "place_images" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "places_slug_index" ON "places" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "places_location_gist" ON "places" USING gist ("location");--> statement-breakpoint
CREATE INDEX "places_name_trgm" ON "places" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "places_status_category_index" ON "places" USING btree ("status","category");--> statement-breakpoint
CREATE INDEX "places_best_months_gin" ON "places" USING gin ("best_months");--> statement-breakpoint
CREATE INDEX "towns_location_gist" ON "towns" USING gist ("location");--> statement-breakpoint
CREATE INDEX "towns_name_trgm" ON "towns" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "upload_intents_user_id_index" ON "upload_intents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "upload_intents_expires_at_index" ON "upload_intents" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "upload_submissions_user_id_created_at_index" ON "upload_submissions" USING btree ("user_id","created_at");
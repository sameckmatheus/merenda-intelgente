CREATE TYPE "public"."help_request_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."help_request_resolution_type" AS ENUM('local', 'central');--> statement-breakpoint
CREATE TYPE "public"."help_request_status" AS ENUM('open', 'in_progress', 'resolved', 'declined', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pendente', 'atendido', 'atendido_parcialmente', 'recusado');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'school_responsible', 'nutritionist');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "help_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"protocol" text NOT NULL,
	"school_id" text NOT NULL,
	"school_name" text NOT NULL,
	"description" text NOT NULL,
	"status" "help_request_status" DEFAULT 'open' NOT NULL,
	"resolution_type" "help_request_resolution_type",
	"resolution_notes" text,
	"priority" "help_request_priority" DEFAULT 'low',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"total_students" jsonb NOT NULL,
	"contacts" jsonb NOT NULL,
	"responsible_ids" text[],
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"respondent_name" text NOT NULL,
	"school" text NOT NULL,
	"date" timestamp NOT NULL,
	"shift" text NOT NULL,
	"menu_type" text NOT NULL,
	"total_students" integer NOT NULL,
	"present_students" integer NOT NULL,
	"help_needed" boolean NOT NULL,
	"description" text,
	"items_purchased" boolean,
	"status" "submission_status" DEFAULT 'pendente',
	"alternative_menu_description" text,
	"missing_items" text,
	"can_buy_missing_items" boolean,
	"supplies_received" boolean,
	"supplies_description" text,
	"observations" text,
	"help_request_id" text,
	"menu_adaptation_reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"uid" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'school_responsible' NOT NULL,
	"school_id" text,
	"phone" text,
	"created_at" timestamp DEFAULT now(),
	"status" "user_status" DEFAULT 'active',
	CONSTRAINT "users_uid_unique" UNIQUE("uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

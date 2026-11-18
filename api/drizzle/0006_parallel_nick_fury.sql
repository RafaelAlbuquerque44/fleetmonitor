CREATE TYPE "public"."maintenance_record_status" AS ENUM('open', 'in_progress', 'waiting_part', 'waiting_service', 'completed');--> statement-breakpoint
CREATE TYPE "public"."tire_event_type" AS ENUM('installation', 'problem', 'rotation', 'inspection', 'replacement');--> statement-breakpoint
ALTER TYPE "public"."vehicle_status" ADD VALUE 'in_operation' BEFORE 'maintenance';--> statement-breakpoint
ALTER TYPE "public"."vehicle_status" ADD VALUE 'stopped' BEFORE 'maintenance';--> statement-breakpoint
ALTER TYPE "public"."vehicle_status" ADD VALUE 'waiting_part' BEFORE 'inactive';--> statement-breakpoint
ALTER TYPE "public"."vehicle_status" ADD VALUE 'waiting_service' BEFORE 'inactive';--> statement-breakpoint
ALTER TYPE "public"."vehicle_status" ADD VALUE 'maintenance_completed' BEFORE 'inactive';--> statement-breakpoint
CREATE TABLE "fuel_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"liters_milliliters" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"occurred_at" date NOT NULL,
	"odometer_km" integer NOT NULL,
	"station" text NOT NULL,
	"route" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"problem" text NOT NULL,
	"responsible" text NOT NULL,
	"due_at" date,
	"parts_used" text,
	"status" "maintenance_record_status" DEFAULT 'open' NOT NULL,
	"occurred_at" date NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tire_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"tire_id" integer NOT NULL,
	"type" "tire_event_type" NOT NULL,
	"description" text NOT NULL,
	"occurred_at" date NOT NULL,
	"odometer_km" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tires" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"position" text NOT NULL,
	"brand" text NOT NULL,
	"installed_at" date NOT NULL,
	"installed_odometer_km" integer NOT NULL,
	"removed_at" date,
	"removed_odometer_km" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "drivers_company_id_id_unique" ON "drivers" USING btree ("company_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "tires_company_id_id_unique" ON "tires" USING btree ("company_id","id");--> statement-breakpoint
ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_company_vehicle_fk" FOREIGN KEY ("company_id","vehicle_id") REFERENCES "public"."vehicles"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_company_driver_fk" FOREIGN KEY ("company_id","driver_id") REFERENCES "public"."drivers"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_company_vehicle_fk" FOREIGN KEY ("company_id","vehicle_id") REFERENCES "public"."vehicles"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tire_events" ADD CONSTRAINT "tire_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tire_events" ADD CONSTRAINT "tire_events_company_tire_fk" FOREIGN KEY ("company_id","tire_id") REFERENCES "public"."tires"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tire_events" ADD CONSTRAINT "tire_events_company_vehicle_fk" FOREIGN KEY ("company_id","vehicle_id") REFERENCES "public"."vehicles"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tires" ADD CONSTRAINT "tires_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tires" ADD CONSTRAINT "tires_company_vehicle_fk" FOREIGN KEY ("company_id","vehicle_id") REFERENCES "public"."vehicles"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fuel_records_company_vehicle_date_idx" ON "fuel_records" USING btree ("company_id","vehicle_id","occurred_at");--> statement-breakpoint
CREATE INDEX "maintenance_records_company_vehicle_date_idx" ON "maintenance_records" USING btree ("company_id","vehicle_id","occurred_at");--> statement-breakpoint
CREATE INDEX "tire_events_company_tire_date_idx" ON "tire_events" USING btree ("company_id","tire_id","occurred_at");--> statement-breakpoint
CREATE INDEX "tires_company_vehicle_position_idx" ON "tires" USING btree ("company_id","vehicle_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "tires_active_position_unique" ON "tires" USING btree ("company_id","vehicle_id","position") WHERE "tires"."removed_at" IS NULL;--> statement-breakpoint
ALTER TABLE "fuel_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fuel_records" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "fuel_records_company_isolation" ON "fuel_records"
  USING ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer)
  WITH CHECK ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer);--> statement-breakpoint
ALTER TABLE "maintenance_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "maintenance_records" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "maintenance_records_company_isolation" ON "maintenance_records"
  USING ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer)
  WITH CHECK ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer);--> statement-breakpoint
ALTER TABLE "tires" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tires" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tires_company_isolation" ON "tires"
  USING ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer)
  WITH CHECK ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer);--> statement-breakpoint
ALTER TABLE "tire_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tire_events" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tire_events_company_isolation" ON "tire_events"
  USING ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer)
  WITH CHECK ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer);
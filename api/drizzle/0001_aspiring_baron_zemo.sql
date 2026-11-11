CREATE TYPE "public"."fleet_cost_category" AS ENUM('fuel', 'maintenance', 'toll', 'insurance', 'tax', 'other');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "fleet_costs" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"category" "fleet_cost_category" NOT NULL,
	"description" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"occurred_at" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"description" text NOT NULL,
	"status" "maintenance_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_at" date,
	"completed_at" date,
	"cost_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fleet_costs" ADD CONSTRAINT "fleet_costs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_costs" ADD CONSTRAINT "fleet_costs_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fleet_costs_company_id_idx" ON "fleet_costs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "fleet_costs_company_vehicle_idx" ON "fleet_costs" USING btree ("company_id","vehicle_id");--> statement-breakpoint
CREATE INDEX "maintenance_orders_company_id_idx" ON "maintenance_orders" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "maintenance_orders_company_vehicle_idx" ON "maintenance_orders" USING btree ("company_id","vehicle_id");--> statement-breakpoint
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vehicles" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "vehicles_company_isolation" ON "vehicles"
  USING ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer)
  WITH CHECK ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer);--> statement-breakpoint
ALTER TABLE "drivers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "drivers" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "drivers_company_isolation" ON "drivers"
  USING ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer)
  WITH CHECK ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer);--> statement-breakpoint
ALTER TABLE "maintenance_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "maintenance_orders" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "maintenance_orders_company_isolation" ON "maintenance_orders"
  USING ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer)
  WITH CHECK ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer);--> statement-breakpoint
ALTER TABLE "fleet_costs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fleet_costs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "fleet_costs_company_isolation" ON "fleet_costs"
  USING ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer)
  WITH CHECK ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer);
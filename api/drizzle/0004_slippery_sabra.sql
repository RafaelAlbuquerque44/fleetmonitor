CREATE TABLE "maintenance_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"description" text NOT NULL,
	"interval_months" integer NOT NULL,
	"next_due_at" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "maintenance_orders" ADD COLUMN "plan_id" integer;--> statement-breakpoint
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_company_vehicle_fk" FOREIGN KEY ("company_id","vehicle_id") REFERENCES "public"."vehicles"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "maintenance_plans_company_id_id_unique" ON "maintenance_plans" USING btree ("company_id","id");--> statement-breakpoint
CREATE INDEX "maintenance_plans_company_vehicle_idx" ON "maintenance_plans" USING btree ("company_id","vehicle_id");--> statement-breakpoint
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_company_plan_fk" FOREIGN KEY ("company_id","plan_id") REFERENCES "public"."maintenance_plans"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_interval_check" CHECK ("interval_months" BETWEEN 1 AND 120);--> statement-breakpoint
ALTER TABLE "maintenance_plans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "maintenance_plans" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "maintenance_plans_company_isolation" ON "maintenance_plans"
  USING ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer)
  WITH CHECK ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer);--> statement-breakpoint
CREATE UNIQUE INDEX "maintenance_orders_open_plan_unique" ON "maintenance_orders" ("company_id", "plan_id")
  WHERE "plan_id" IS NOT NULL AND "status" IN ('scheduled', 'in_progress');
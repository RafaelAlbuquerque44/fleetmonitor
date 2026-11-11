ALTER TABLE "fleet_costs" DROP CONSTRAINT "fleet_costs_vehicle_id_vehicles_id_fk";
--> statement-breakpoint
ALTER TABLE "maintenance_orders" DROP CONSTRAINT "maintenance_orders_vehicle_id_vehicles_id_fk";
--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_company_id_id_unique" ON "vehicles" USING btree ("company_id","id");
--> statement-breakpoint
ALTER TABLE "fleet_costs" ADD CONSTRAINT "fleet_costs_company_vehicle_fk" FOREIGN KEY ("company_id","vehicle_id") REFERENCES "public"."vehicles"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_company_vehicle_fk" FOREIGN KEY ("company_id","vehicle_id") REFERENCES "public"."vehicles"("company_id","id") ON DELETE no action ON UPDATE no action;
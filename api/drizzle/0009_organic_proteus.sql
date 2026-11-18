CREATE TYPE "public"."maintenance_service_type" AS ENUM('oil_change', 'brake_pads', 'washing', 'other');--> statement-breakpoint
CREATE TABLE "leituras_odometro" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"occurred_at" date NOT NULL,
	"odometer_km" integer NOT NULL,
	"distance_km" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planos_manutencao_km" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"service_type" "maintenance_service_type" NOT NULL,
	"interval_km" integer NOT NULL,
	"last_service_odometer_km" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servicos_frota" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"driver_id" integer,
	"service_type" "maintenance_service_type" NOT NULL,
	"description" text,
	"occurred_at" date NOT NULL,
	"odometer_km" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "veiculos" ADD COLUMN "chassis_number" text;--> statement-breakpoint
ALTER TABLE "leituras_odometro" ADD CONSTRAINT "leituras_odometro_company_id_empresas_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leituras_odometro" ADD CONSTRAINT "odometer_readings_company_vehicle_fk" FOREIGN KEY ("company_id","vehicle_id") REFERENCES "public"."veiculos"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leituras_odometro" ADD CONSTRAINT "odometer_readings_company_driver_fk" FOREIGN KEY ("company_id","driver_id") REFERENCES "public"."motoristas"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planos_manutencao_km" ADD CONSTRAINT "planos_manutencao_km_company_id_empresas_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planos_manutencao_km" ADD CONSTRAINT "maintenance_plans_km_company_vehicle_fk" FOREIGN KEY ("company_id","vehicle_id") REFERENCES "public"."veiculos"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicos_frota" ADD CONSTRAINT "servicos_frota_company_id_empresas_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicos_frota" ADD CONSTRAINT "vehicle_services_company_vehicle_fk" FOREIGN KEY ("company_id","vehicle_id") REFERENCES "public"."veiculos"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicos_frota" ADD CONSTRAINT "vehicle_services_company_driver_fk" FOREIGN KEY ("company_id","driver_id") REFERENCES "public"."motoristas"("company_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "odometer_readings_company_vehicle_date_idx" ON "leituras_odometro" USING btree ("company_id","vehicle_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "maintenance_plans_km_company_vehicle_type_unique" ON "planos_manutencao_km" USING btree ("company_id","vehicle_id","service_type");--> statement-breakpoint
CREATE INDEX "vehicle_services_company_vehicle_date_idx" ON "servicos_frota" USING btree ("company_id","vehicle_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_company_chassis_unique" ON "veiculos" USING btree ("company_id","chassis_number") WHERE "veiculos"."chassis_number" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "leituras_odometro" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "leituras_odometro" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "leituras_odometro_company_isolation" ON "leituras_odometro"
  USING ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer)
  WITH CHECK ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer);
--> statement-breakpoint
ALTER TABLE "planos_manutencao_km" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "planos_manutencao_km" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "planos_manutencao_km_company_isolation" ON "planos_manutencao_km"
  USING ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer)
  WITH CHECK ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer);
--> statement-breakpoint
ALTER TABLE "servicos_frota" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "servicos_frota" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "servicos_frota_company_isolation" ON "servicos_frota"
  USING ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer)
  WITH CHECK ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fleetmonitor_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON
      "leituras_odometro", "planos_manutencao_km", "servicos_frota"
      TO fleetmonitor_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fleetmonitor_app;
  END IF;
END $$;
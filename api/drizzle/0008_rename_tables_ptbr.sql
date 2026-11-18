DO $$
DECLARE
  table_pair text[];
  table_pairs text[][] := ARRAY[
    ARRAY['companies', 'empresas'],
    ARRAY['vehicles', 'veiculos'],
    ARRAY['drivers', 'motoristas'],
    ARRAY['fuel_records', 'abastecimentos'],
    ARRAY['maintenance_records', 'registros_manutencao'],
    ARRAY['tires', 'pneus'],
    ARRAY['tire_events', 'eventos_pneus'],
    ARRAY['maintenance_plans', 'planos_manutencao'],
    ARRAY['maintenance_orders', 'ordens_manutencao'],
    ARRAY['fleet_costs', 'custos_frota'],
    ARRAY['auth_users', 'usuarios'],
    ARRAY['auth_sessions', 'sessoes_autenticacao'],
    ARRAY['contact_requests', 'solicitacoes_contato'],
    ARRAY['fleet_operations', 'operacoes_frota'],
    ARRAY['fleet_routes', 'rotas_frota'],
    ARRAY['ai_chat_sessions', 'conversas_ia'],
    ARRAY['ai_chat_messages', 'mensagens_ia']
  ];
BEGIN
  FOREACH table_pair SLICE 1 IN ARRAY table_pairs LOOP
    IF to_regclass(format('public.%I', table_pair[1])) IS NOT NULL THEN
      IF to_regclass(format('public.%I', table_pair[2])) IS NOT NULL THEN
        RAISE EXCEPTION 'Both old and Portuguese tables exist: %, %',
          table_pair[1], table_pair[2];
      END IF;
      EXECUTE format(
        'ALTER TABLE public.%I RENAME TO %I',
        table_pair[1],
        table_pair[2]
      );
    END IF;
  END LOOP;
END $$;
--> statement-breakpoint
ALTER TABLE "sessoes_autenticacao"
  RENAME CONSTRAINT "auth_sessions_user_id_auth_users_id_fk"
  TO "sessoes_autenticacao_user_id_usuarios_id_fk";
--> statement-breakpoint
ALTER TABLE "usuarios"
  RENAME CONSTRAINT "auth_users_company_id_companies_id_fk"
  TO "usuarios_company_id_empresas_id_fk";
--> statement-breakpoint
ALTER TABLE "motoristas"
  RENAME CONSTRAINT "drivers_company_id_companies_id_fk"
  TO "motoristas_company_id_empresas_id_fk";
--> statement-breakpoint
ALTER TABLE "custos_frota"
  RENAME CONSTRAINT "fleet_costs_company_id_companies_id_fk"
  TO "custos_frota_company_id_empresas_id_fk";
--> statement-breakpoint
ALTER TABLE "abastecimentos"
  RENAME CONSTRAINT "fuel_records_company_id_companies_id_fk"
  TO "abastecimentos_company_id_empresas_id_fk";
--> statement-breakpoint
ALTER TABLE "ordens_manutencao"
  RENAME CONSTRAINT "maintenance_orders_company_id_companies_id_fk"
  TO "ordens_manutencao_company_id_empresas_id_fk";
--> statement-breakpoint
ALTER TABLE "planos_manutencao"
  RENAME CONSTRAINT "maintenance_plans_company_id_companies_id_fk"
  TO "planos_manutencao_company_id_empresas_id_fk";
--> statement-breakpoint
ALTER TABLE "registros_manutencao"
  RENAME CONSTRAINT "maintenance_records_company_id_companies_id_fk"
  TO "registros_manutencao_company_id_empresas_id_fk";
--> statement-breakpoint
ALTER TABLE "eventos_pneus"
  RENAME CONSTRAINT "tire_events_company_id_companies_id_fk"
  TO "eventos_pneus_company_id_empresas_id_fk";
--> statement-breakpoint
ALTER TABLE "pneus"
  RENAME CONSTRAINT "tires_company_id_companies_id_fk"
  TO "pneus_company_id_empresas_id_fk";
--> statement-breakpoint
ALTER TABLE "veiculos"
  RENAME CONSTRAINT "vehicles_company_id_companies_id_fk"
  TO "veiculos_company_id_empresas_id_fk";
--> statement-breakpoint
ALTER TABLE "sessoes_autenticacao"
  RENAME CONSTRAINT "auth_sessions_token_hash_unique"
  TO "sessoes_autenticacao_token_hash_unique";
--> statement-breakpoint
ALTER TABLE "usuarios"
  RENAME CONSTRAINT "auth_users_email_unique"
  TO "usuarios_email_unique";
--> statement-breakpoint
ALTER TABLE "empresas"
  RENAME CONSTRAINT "companies_name_unique"
  TO "empresas_name_unique";
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."ai_message_role" AS ENUM('user', 'assistant');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversas_ia" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_id" integer NOT NULL REFERENCES "empresas"("id"),
  "user_id" integer NOT NULL REFERENCES "usuarios"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mensagens_ia" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_id" integer NOT NULL,
  "session_id" integer NOT NULL,
  "role" "ai_message_role" NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "conversas_ia_company_id_id_unique"
  ON "conversas_ia" USING btree ("company_id", "id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversas_ia_company_user_updated_idx"
  ON "conversas_ia" USING btree ("company_id", "user_id", "updated_at");
--> statement-breakpoint
ALTER TABLE "mensagens_ia" ADD COLUMN IF NOT EXISTS "company_id" integer;
--> statement-breakpoint
UPDATE "mensagens_ia" AS messages
SET "company_id" = sessions."company_id"
FROM "conversas_ia" AS sessions
WHERE messages."session_id" = sessions."id"
  AND messages."company_id" IS NULL;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "mensagens_ia" WHERE "company_id" IS NULL) THEN
    RAISE EXCEPTION 'Chat messages could not be linked to an owning company';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "mensagens_ia" ALTER COLUMN "company_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "mensagens_ia"
  DROP CONSTRAINT IF EXISTS "ai_chat_messages_session_id_ai_chat_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "mensagens_ia"
  DROP CONSTRAINT IF EXISTS "mensagens_ia_company_session_fk";
--> statement-breakpoint
ALTER TABLE "mensagens_ia"
  ADD CONSTRAINT "mensagens_ia_company_session_fk"
  FOREIGN KEY ("company_id", "session_id")
  REFERENCES "conversas_ia"("company_id", "id")
  ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mensagens_ia_company_session_created_idx"
  ON "mensagens_ia" USING btree ("company_id", "session_id", "created_at");
--> statement-breakpoint
ALTER TABLE "conversas_ia" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "conversas_ia" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "conversas_ia_company_isolation" ON "conversas_ia";
--> statement-breakpoint
CREATE POLICY "conversas_ia_company_isolation" ON "conversas_ia"
  USING ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer)
  WITH CHECK ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer);
--> statement-breakpoint
ALTER TABLE "mensagens_ia" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "mensagens_ia" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "mensagens_ia_company_isolation" ON "mensagens_ia";
--> statement-breakpoint
CREATE POLICY "mensagens_ia_company_isolation" ON "mensagens_ia"
  USING ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer)
  WITH CHECK ("company_id" = NULLIF(current_setting('app.company_id', true), '')::integer);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fleetmonitor_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fleetmonitor_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fleetmonitor_app;
  END IF;
END $$;
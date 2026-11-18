import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  foreignKey,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "operational",
  "in_operation",
  "stopped",
  "maintenance",
  "waiting_part",
  "waiting_service",
  "maintenance_completed",
  "inactive",
]);

export const driverStatusEnum = pgEnum("driver_status", ["active", "inactive"]);

export const driverLicenseCategoryEnum = pgEnum("driver_license_category", [
  "A",
  "B",
  "C",
  "D",
  "E",
  "AB",
  "AC",
  "AD",
  "AE",
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);

export const fleetCostCategoryEnum = pgEnum("fleet_cost_category", [
  "fuel",
  "maintenance",
  "toll",
  "insurance",
  "tax",
  "other",
]);

export const maintenanceRecordStatusEnum = pgEnum("maintenance_record_status", [
  "open",
  "in_progress",
  "waiting_part",
  "waiting_service",
  "completed",
]);

export const tireEventTypeEnum = pgEnum("tire_event_type", [
  "installation",
  "problem",
  "rotation",
  "inspection",
  "replacement",
]);

export const maintenanceServiceTypeEnum = pgEnum("maintenance_service_type", [
  "oil_change",
  "brake_pads",
  "washing",
  "other",
]);

export const aiMessageRoleEnum = pgEnum("ai_message_role", ["user", "assistant"]);

export const companies = pgTable("empresas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const vehicles = pgTable("veiculos", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  plate: text("plate").notNull(),
  chassisNumber: text("chassis_number"),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  status: vehicleStatusEnum("status").notNull().default("operational"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("vehicles_company_id_idx").on(table.companyId),
  uniqueIndex("vehicles_company_id_id_unique").on(table.companyId, table.id),
  uniqueIndex("vehicles_company_id_plate_unique").on(table.companyId, table.plate),
  uniqueIndex("vehicles_company_chassis_unique")
    .on(table.companyId, table.chassisNumber)
    .where(sql`${table.chassisNumber} IS NOT NULL`),
]);

export const drivers = pgTable("motoristas", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  fullName: text("full_name").notNull(),
  cpf: text("cpf").notNull(),
  licenseNumber: text("license_number").notNull(),
  licenseCategory: driverLicenseCategoryEnum("license_category").notNull(),
  licenseExpiresAt: date("license_expires_at").notNull(),
  phone: text("phone"),
  status: driverStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("drivers_company_id_idx").on(table.companyId),
  uniqueIndex("drivers_company_id_id_unique").on(table.companyId, table.id),
  uniqueIndex("drivers_company_id_cpf_unique").on(table.companyId, table.cpf),
]);

export const fuelRecords = pgTable("abastecimentos", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  vehicleId: integer("vehicle_id").notNull(),
  driverId: integer("driver_id").notNull(),
  litersMilliliters: integer("liters_milliliters").notNull(),
  amountCents: integer("amount_cents").notNull(),
  occurredAt: date("occurred_at").notNull(),
  odometerKm: integer("odometer_km").notNull(),
  station: text("station"),
  route: text("route").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("fuel_records_company_vehicle_date_idx").on(table.companyId, table.vehicleId, table.occurredAt),
  foreignKey({
    columns: [table.companyId, table.vehicleId],
    foreignColumns: [vehicles.companyId, vehicles.id],
    name: "fuel_records_company_vehicle_fk",
  }),
  foreignKey({
    columns: [table.companyId, table.driverId],
    foreignColumns: [drivers.companyId, drivers.id],
    name: "fuel_records_company_driver_fk",
  }),
]);

export const maintenanceRecords = pgTable("registros_manutencao", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  vehicleId: integer("vehicle_id").notNull(),
  problem: text("problem").notNull(),
  responsible: text("responsible").notNull(),
  dueAt: date("due_at"),
  partsUsed: text("parts_used"),
  status: maintenanceRecordStatusEnum("status").notNull().default("open"),
  occurredAt: date("occurred_at").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("maintenance_records_company_vehicle_date_idx").on(table.companyId, table.vehicleId, table.occurredAt),
  foreignKey({
    columns: [table.companyId, table.vehicleId],
    foreignColumns: [vehicles.companyId, vehicles.id],
    name: "maintenance_records_company_vehicle_fk",
  }),
]);

export const tires = pgTable("pneus", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  vehicleId: integer("vehicle_id").notNull(),
  position: text("position").notNull(),
  brand: text("brand").notNull(),
  installedAt: date("installed_at").notNull(),
  installedOdometerKm: integer("installed_odometer_km").notNull(),
  removedAt: date("removed_at"),
  removedOdometerKm: integer("removed_odometer_km"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("tires_company_id_id_unique").on(table.companyId, table.id),
  index("tires_company_vehicle_position_idx").on(table.companyId, table.vehicleId, table.position),
  uniqueIndex("tires_active_position_unique")
    .on(table.companyId, table.vehicleId, table.position)
    .where(sql`${table.removedAt} IS NULL`),
  foreignKey({
    columns: [table.companyId, table.vehicleId],
    foreignColumns: [vehicles.companyId, vehicles.id],
    name: "tires_company_vehicle_fk",
  }),
]);

export const tireEvents = pgTable("eventos_pneus", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  vehicleId: integer("vehicle_id").notNull(),
  tireId: integer("tire_id").notNull(),
  type: tireEventTypeEnum("type").notNull(),
  description: text("description").notNull(),
  occurredAt: date("occurred_at").notNull(),
  odometerKm: integer("odometer_km").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("tire_events_company_tire_date_idx").on(table.companyId, table.tireId, table.occurredAt),
  foreignKey({
    columns: [table.companyId, table.tireId],
    foreignColumns: [tires.companyId, tires.id],
    name: "tire_events_company_tire_fk",
  }),
  foreignKey({
    columns: [table.companyId, table.vehicleId],
    foreignColumns: [vehicles.companyId, vehicles.id],
    name: "tire_events_company_vehicle_fk",
  }),
]);

export const maintenancePlans = pgTable("planos_manutencao", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  vehicleId: integer("vehicle_id").notNull(),
  description: text("description").notNull(),
  intervalMonths: integer("interval_months").notNull(),
  nextDueAt: date("next_due_at").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("maintenance_plans_company_id_id_unique").on(table.companyId, table.id),
  index("maintenance_plans_company_vehicle_idx").on(table.companyId, table.vehicleId),
  foreignKey({
    columns: [table.companyId, table.vehicleId],
    foreignColumns: [vehicles.companyId, vehicles.id],
    name: "maintenance_plans_company_vehicle_fk",
  }),
]);

export const maintenanceOrders = pgTable("ordens_manutencao", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  vehicleId: integer("vehicle_id").notNull(),
  planId: integer("plan_id"),
  description: text("description").notNull(),
  status: maintenanceStatusEnum("status").notNull().default("scheduled"),
  scheduledAt: date("scheduled_at"),
  completedAt: date("completed_at"),
  costCents: integer("cost_cents"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("maintenance_orders_company_id_idx").on(table.companyId),
  index("maintenance_orders_company_vehicle_idx").on(table.companyId, table.vehicleId),
  foreignKey({
    columns: [table.companyId, table.vehicleId],
    foreignColumns: [vehicles.companyId, vehicles.id],
    name: "maintenance_orders_company_vehicle_fk",
  }),
  foreignKey({
    columns: [table.companyId, table.planId],
    foreignColumns: [maintenancePlans.companyId, maintenancePlans.id],
    name: "maintenance_orders_company_plan_fk",
  }),
]);

export const odometerReadings = pgTable("leituras_odometro", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  vehicleId: integer("vehicle_id").notNull(),
  driverId: integer("driver_id").notNull(),
  occurredAt: date("occurred_at").notNull(),
  odometerKm: integer("odometer_km").notNull(),
  distanceKm: integer("distance_km"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("odometer_readings_company_vehicle_date_idx").on(
    table.companyId,
    table.vehicleId,
    table.occurredAt,
  ),
  foreignKey({
    columns: [table.companyId, table.vehicleId],
    foreignColumns: [vehicles.companyId, vehicles.id],
    name: "odometer_readings_company_vehicle_fk",
  }),
  foreignKey({
    columns: [table.companyId, table.driverId],
    foreignColumns: [drivers.companyId, drivers.id],
    name: "odometer_readings_company_driver_fk",
  }),
]);

export const preventiveMaintenancePlans = pgTable("planos_manutencao_km", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  vehicleId: integer("vehicle_id").notNull(),
  serviceType: maintenanceServiceTypeEnum("service_type").notNull(),
  intervalKm: integer("interval_km").notNull(),
  lastServiceOdometerKm: integer("last_service_odometer_km").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("maintenance_plans_km_company_vehicle_type_unique").on(
    table.companyId,
    table.vehicleId,
    table.serviceType,
  ),
  foreignKey({
    columns: [table.companyId, table.vehicleId],
    foreignColumns: [vehicles.companyId, vehicles.id],
    name: "maintenance_plans_km_company_vehicle_fk",
  }),
]);

export const vehicleServices = pgTable("servicos_frota", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  vehicleId: integer("vehicle_id").notNull(),
  driverId: integer("driver_id"),
  serviceType: maintenanceServiceTypeEnum("service_type").notNull(),
  description: text("description"),
  occurredAt: date("occurred_at").notNull(),
  odometerKm: integer("odometer_km").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("vehicle_services_company_vehicle_date_idx").on(
    table.companyId,
    table.vehicleId,
    table.occurredAt,
  ),
  foreignKey({
    columns: [table.companyId, table.vehicleId],
    foreignColumns: [vehicles.companyId, vehicles.id],
    name: "vehicle_services_company_vehicle_fk",
  }),
  foreignKey({
    columns: [table.companyId, table.driverId],
    foreignColumns: [drivers.companyId, drivers.id],
    name: "vehicle_services_company_driver_fk",
  }),
]);

export const fleetCosts = pgTable("custos_frota", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  vehicleId: integer("vehicle_id").notNull(),
  category: fleetCostCategoryEnum("category").notNull(),
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  occurredAt: date("occurred_at").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("fleet_costs_company_id_idx").on(table.companyId),
  index("fleet_costs_company_vehicle_idx").on(table.companyId, table.vehicleId),
  foreignKey({
    columns: [table.companyId, table.vehicleId],
    foreignColumns: [vehicles.companyId, vehicles.id],
    name: "fleet_costs_company_vehicle_fk",
  }),
]);

export const authUsers = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  email: text("email").notNull().unique(),
  companyName: text("company_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  readOnly: boolean("read_only").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("auth_users_company_id_idx").on(table.companyId)]);

export const authSessions = pgTable("sessoes_autenticacao", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("auth_sessions_expires_at_idx").on(table.expiresAt)]);

export const contactRequests = pgTable("solicitacoes_contato", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  companyName: text("company_name"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiChatSessions = pgTable("conversas_ia", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  userId: integer("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("conversas_ia_company_user_updated_idx").on(
    table.companyId,
    table.userId,
    table.updatedAt,
  ),
  uniqueIndex("conversas_ia_company_id_id_unique").on(table.companyId, table.id),
]).enableRLS();

export const aiChatMessages = pgTable("mensagens_ia", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  sessionId: integer("session_id").notNull(),
  role: aiMessageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("mensagens_ia_company_session_created_idx").on(
    table.companyId,
    table.sessionId,
    table.createdAt,
  ),
  foreignKey({
    columns: [table.companyId, table.sessionId],
    foreignColumns: [aiChatSessions.companyId, aiChatSessions.id],
    name: "mensagens_ia_company_session_fk",
  }).onDelete("cascade"),
]).enableRLS();

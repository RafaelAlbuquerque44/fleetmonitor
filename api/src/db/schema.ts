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
  "maintenance",
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

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  plate: text("plate").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  status: vehicleStatusEnum("status").notNull().default("operational"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("vehicles_company_id_idx").on(table.companyId),
  uniqueIndex("vehicles_company_id_id_unique").on(table.companyId, table.id),
  uniqueIndex("vehicles_company_id_plate_unique").on(table.companyId, table.plate),
]);

export const drivers = pgTable("drivers", {
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
  uniqueIndex("drivers_company_id_cpf_unique").on(table.companyId, table.cpf),
]);

export const maintenanceOrders = pgTable("maintenance_orders", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id),
  vehicleId: integer("vehicle_id").notNull(),
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
]);

export const fleetCosts = pgTable("fleet_costs", {
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

export const authUsers = pgTable("auth_users", {
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

export const authSessions = pgTable("auth_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("auth_sessions_expires_at_idx").on(table.expiresAt)]);

export const contactRequests = pgTable("contact_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  companyName: text("company_name"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

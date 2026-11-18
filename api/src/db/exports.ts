import { asc, eq } from "drizzle-orm";
import { drivers, vehicles } from "./schema";
import { withTenantTransaction } from "./tenant";

export const exportTypes = ["vehicles", "drivers"] as const;
export type ExportType = (typeof exportTypes)[number];
type Cell = string | number | null;
type ExportData = { title: string; columns: string[]; rows: Cell[][] };

export function isExportType(value: string): value is ExportType {
  return exportTypes.some((type) => type === value);
}

export async function exportCompanyData(companyId: number, type: ExportType): Promise<ExportData> {
  return withTenantTransaction(companyId, async (tx) => {
    switch (type) {
      case "vehicles": {
        const items = await tx.select().from(vehicles).where(eq(vehicles.companyId, companyId)).orderBy(asc(vehicles.plate), asc(vehicles.id));
        const statuses = {
          operational: "Disponível",
          in_operation: "Em operação",
          stopped: "Parado",
          maintenance: "Em manutenção",
          waiting_part: "Aguardando peça",
          waiting_service: "Aguardando serviço",
          maintenance_completed: "Manutenção finalizada",
          inactive: "Inativo",
        };
        return { title: "Veículos", columns: ["ID", "Placa", "Marca", "Modelo", "Ano", "Status"],
          rows: items.map((item) => [item.id, item.plate, item.make, item.model, item.year, statuses[item.status]]) };
      }
      case "drivers": {
        const items = await tx.select().from(drivers).where(eq(drivers.companyId, companyId)).orderBy(asc(drivers.fullName), asc(drivers.id));
        return { title: "Motoristas", columns: ["ID", "Nome", "CPF", "CNH", "Categoria", "Validade CNH", "Telefone", "Status"],
          rows: items.map((item) => [item.id, item.fullName, item.cpf, item.licenseNumber, item.licenseCategory, item.licenseExpiresAt, item.phone, item.status === "active" ? "Ativo" : "Inativo"]) };
      }
    }
  });
}

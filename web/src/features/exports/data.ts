import { readApiError, redirectOnUnauthorized } from "../../lib/api";

export const datasets = {
  vehicles: { label: "Veículos", description: "Placa, modelo, ano e situação da frota." },
  drivers: { label: "Motoristas", description: "Cadastro, CPF, habilitação e validade." },
} as const;
export type Dataset = keyof typeof datasets;
export type ExportFormat = "csv" | "xlsx" | "pdf";
export type ExportCell = string | number | null;
export type ExportData = { title: string; columns: string[]; rows: ExportCell[][] };

function isExportData(value: unknown): value is ExportData {
  if (typeof value !== "object" || value === null || !("title" in value) ||
      typeof value.title !== "string" || !("columns" in value) || !Array.isArray(value.columns) ||
      value.columns.length === 0 || !value.columns.every((column: unknown) => typeof column === "string") ||
      !("rows" in value) || !Array.isArray(value.rows)) return false;
  const width = value.columns.length;
  return value.rows.every((row: unknown) => Array.isArray(row) && row.length === width &&
    row.every((cell: unknown) => cell === null || typeof cell === "string" || (typeof cell === "number" && Number.isFinite(cell))));
}

export async function fetchExportData(dataset: Dataset): Promise<ExportData> {
  const response = await fetch(`/api/exports/${dataset}`, { cache: "no-store" });
  if (!response.ok) {
    redirectOnUnauthorized(response);
    throw new Error(await readApiError(response, "Não foi possível carregar os dados para exportação."));
  }
  const data: unknown = await response.json();
  if (!isExportData(data)) throw new Error("A resposta da exportação está em um formato inválido.");
  return data;
}

export function toCsv(data: ExportData): string {
  function escape(cell: ExportCell): string {
    let value = cell === null ? "" : typeof cell === "number" ? String(cell).replace(".", ",") : cell;
    if (typeof cell === "string" && (/^[\t\r\n]/.test(value) || /^[\s\u0000-\u001f]*[=+\-@]/.test(value))) value = `'${value}`;
    return `"${value.replaceAll('"', '""')}"`;
  }
  return "\uFEFF" + [data.columns, ...data.rows].map((row) => row.map(escape).join(";")).join("\r\n") + "\r\n";
}

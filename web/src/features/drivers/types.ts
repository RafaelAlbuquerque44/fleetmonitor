export type DriverStatus = "active" | "inactive";
export type DriverLicenseCategory = "A" | "B" | "C" | "D" | "E" | "AB" | "AC" | "AD" | "AE";

export type Driver = {
  id: number;
  fullName: string;
  cpf: string;
  licenseNumber: string;
  licenseCategory: DriverLicenseCategory;
  licenseExpiresAt: string;
  phone: string | null;
  status: DriverStatus;
};

export type DriverDraft = Omit<Driver, "id">;
export type DriverStatusCounts = Record<DriverStatus, number>;

export type DriverListResponse = {
  items: Driver[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  statusCounts: DriverStatusCounts;
};

export const driverPageSize = 25;

export const driverStatusLabels: Record<DriverStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

export const driverLicenseCategories: DriverLicenseCategory[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "AB",
  "AC",
  "AD",
  "AE",
];

export function isDriverStatus(value: unknown): value is DriverStatus {
  return value === "active" || value === "inactive";
}

export function isDriverLicenseCategory(value: unknown): value is DriverLicenseCategory {
  return typeof value === "string" && driverLicenseCategories.includes(value as DriverLicenseCategory);
}

export function isDriver(value: unknown): value is Driver {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "number" &&
    "fullName" in value &&
    typeof value.fullName === "string" &&
    "cpf" in value &&
    typeof value.cpf === "string" &&
    "licenseNumber" in value &&
    typeof value.licenseNumber === "string" &&
    "licenseCategory" in value &&
    isDriverLicenseCategory(value.licenseCategory) &&
    "licenseExpiresAt" in value &&
    typeof value.licenseExpiresAt === "string" &&
    "phone" in value &&
    (typeof value.phone === "string" || value.phone === null) &&
    "status" in value &&
    isDriverStatus(value.status)
  );
}

export function isDriverListResponse(value: unknown): value is DriverListResponse {
  if (typeof value !== "object" || value === null || !("statusCounts" in value)) {
    return false;
  }
  const counts = value.statusCounts;
  return (
    "items" in value &&
    Array.isArray(value.items) &&
    value.items.every(isDriver) &&
    "page" in value &&
    typeof value.page === "number" &&
    "pageSize" in value &&
    value.pageSize === driverPageSize &&
    "totalItems" in value &&
    typeof value.totalItems === "number" &&
    "totalPages" in value &&
    typeof value.totalPages === "number" &&
    typeof counts === "object" &&
    counts !== null &&
    "active" in counts &&
    typeof counts.active === "number" &&
    "inactive" in counts &&
    typeof counts.inactive === "number"
  );
}

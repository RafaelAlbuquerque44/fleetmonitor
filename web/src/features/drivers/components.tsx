import { Icon } from "../../components/Icon";
import { driverStatusLabels, type Driver, type DriverStatus } from "./types";

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  const colorClass = status === "active"
    ? "bg-[#edf5e7] text-[#5f813e] dark:bg-[#293627] dark:text-[#c4f36b]"
    : "bg-[#edf0ee] text-[#68756c] dark:bg-[#29312c] dark:text-[#b8c4bb]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colorClass}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {driverStatusLabels[status]}
    </span>
  );
}

export function DriverActions({
  driver,
  onEdit,
  onDelete,
}: {
  driver: Driver;
  onEdit: (driver: Driver) => void;
  onDelete: (driver: Driver) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button type="button" onClick={() => onEdit(driver)} className="rounded-lg border border-[#e1e7df] px-3 py-1.5 text-xs font-medium text-[#526056] transition hover:bg-[#f3f6ef] dark:border-[#3b473d] dark:text-[#d9e1da] dark:hover:bg-[#263226]">
        Editar
      </button>
      <button type="button" onClick={() => onDelete(driver)} className="rounded-lg border border-[#f0dada] px-3 py-1.5 text-xs font-medium text-[#a34848] transition hover:bg-[#fff4f4] dark:border-[#573838] dark:text-[#f2aaaa] dark:hover:bg-[#352323]">
        Remover
      </button>
    </div>
  );
}

export function DriverIdentityIcon() {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4e6] text-[#6d9144] dark:bg-[#293627] dark:text-[#c4f36b]">
      <Icon name="driver" className="size-5" />
    </span>
  );
}

export function formatCpf(cpf: string): string {
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

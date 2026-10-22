import { Icon, type IconName } from "../../components/Icon";
import { vehicleStatusLabels, type Vehicle, type VehicleStatus } from "./types";

export function DashboardStat({
  label,
  value,
  icon,
  detail,
  tone = "green",
}: {
  label: string;
  value: number;
  icon: IconName;
  detail: string;
  tone?: "green" | "amber" | "slate";
}) {
  const toneClass = {
    green: "bg-[#edf4e6] text-[#6d9144] dark:bg-[#293627] dark:text-[#c4f36b]",
    amber: "bg-[#fbf2df] text-[#a77a25] dark:bg-[#3a3020] dark:text-[#e5c16c]",
    slate: "bg-[#edf0ee] text-[#69776e] dark:bg-[#29312c] dark:text-[#b8c4bb]",
  }[tone];

  return (
    <article className="rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-[#303b33] dark:bg-[#19211b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[#748078] dark:text-[#a7b2a9]">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className={`flex size-10 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon name={icon} className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-[#929c93] dark:text-[#879389]">{detail}</p>
    </article>
  );
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const colorClass = {
    operational: "bg-[#edf5e7] text-[#5f813e] dark:bg-[#293627] dark:text-[#c4f36b]",
    maintenance: "bg-[#fbf2df] text-[#98701f] dark:bg-[#3a3020] dark:text-[#e5c16c]",
    inactive: "bg-[#edf0ee] text-[#68756c] dark:bg-[#29312c] dark:text-[#b8c4bb]",
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colorClass}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {vehicleStatusLabels[status]}
    </span>
  );
}

export function VehicleActions({
  vehicle,
  onEdit,
  onDelete,
}: {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onEdit(vehicle)}
        className="rounded-lg border border-[#e1e7df] px-3 py-1.5 text-xs font-medium text-[#526056] transition hover:bg-[#f3f6ef] dark:border-[#3b473d] dark:text-[#d9e1da] dark:hover:bg-[#263226]"
      >
        Editar
      </button>
      <button
        type="button"
        onClick={() => onDelete(vehicle)}
        className="rounded-lg border border-[#f0dada] px-3 py-1.5 text-xs font-medium text-[#a34848] transition hover:bg-[#fff4f4] dark:border-[#573838] dark:text-[#f2aaaa] dark:hover:bg-[#352323]"
      >
        Remover
      </button>
    </div>
  );
}

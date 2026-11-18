import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "../../components/Icon";
import { vehicleStatusLabels, type Vehicle, type VehicleStatus } from "./types";
import { Card } from "../../components/ui/card";

export function DashboardStat({
  label,
  value,
  icon,
  detail,
  tone = "green",
  className,
}: {
  label: string;
  value: number;
  icon: IconName;
  detail: string;
  tone?: "green" | "amber" | "slate";
  className?: string;
}) {
  const toneClass = {
    green: "bg-[#eeeeee] text-[#6d9144] dark:bg-fleet-highlight dark:text-[#c4f36b]",
    amber: "bg-[#fbf2df] text-[#a77a25] dark:bg-[#3a3020] dark:text-[#e5c16c]",
    slate: "bg-[#edf0ee] text-[#69776e] dark:bg-fleet-highlight dark:text-[#b8c4bb]",
  }[tone];

  return (
    <Card className={`p-5 ${className ?? ""}`}>
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
    </Card>
  );
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const colorClasses: Record<VehicleStatus, string> = {
    operational: "bg-[#efefef] text-[#5f813e] dark:bg-fleet-highlight dark:text-[#c4f36b]",
    in_operation: "bg-[#efefef] text-[#4d8062] dark:bg-[#263b30] dark:text-[#a7d6b7]",
    stopped: "bg-[#edf0ee] text-[#68756c] dark:bg-fleet-highlight dark:text-[#b8c4bb]",
    maintenance: "bg-[#fbf2df] text-[#98701f] dark:bg-[#3a3020] dark:text-[#e5c16c]",
    waiting_part: "bg-[#fbefe5] text-[#a2602e] dark:bg-[#3a2d22] dark:text-[#e2ae80]",
    waiting_service: "bg-[#f7f0e2] text-[#8d7137] dark:bg-[#393222] dark:text-[#dcc58a]",
    maintenance_completed: "bg-[#efefef] text-[#5f813e] dark:bg-fleet-highlight dark:text-[#c4f36b]",
    inactive: "bg-[#edf0ee] text-[#68756c] dark:bg-fleet-highlight dark:text-[#b8c4bb]",
  };
  const colorClass = colorClasses[status];

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
  onSendToMaintenance,
  maintenancePending = false,
}: {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  onSendToMaintenance: (vehicle: Vehicle) => void;
  maintenancePending?: boolean;
}) {
  const canSendToMaintenance = [
    "operational",
    "in_operation",
    "stopped",
    "maintenance_completed",
  ].includes(vehicle.status);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canSendToMaintenance && (
        <Button
          variant="unstyled"
          size="auto"
          type="button"
          onClick={() => onSendToMaintenance(vehicle)}
          disabled={maintenancePending}
          aria-label={`Enviar ${vehicle.plate} para manutenção`}
          className="rounded-lg border border-[#eadbb8] px-3 py-1.5 text-xs font-medium text-[#8d6a25] transition hover:bg-[#fbf2df] disabled:cursor-wait disabled:opacity-60 dark:border-[#5b4b2d] dark:text-[#e5c16c] dark:hover:bg-[#3a3020]"
        >
          {maintenancePending ? "Atualizando..." : "Enviar à manutenção"}
        </Button>
      )}
      <Button variant="unstyled" size="auto"
        type="button"
        onClick={() => onEdit(vehicle)}
        className="rounded-lg border border-[#e1e7df] px-3 py-1.5 text-xs font-medium text-[#526056] transition hover:bg-[#f3f3f3] dark:border-fleet-input-border dark:text-[#d9e1da] dark:hover:bg-fleet-highlight"
      >
        Editar
      </Button>
      <Button variant="unstyled" size="auto"
        type="button"
        onClick={() => onDelete(vehicle)}
        className="rounded-lg border border-[#f0dada] px-3 py-1.5 text-xs font-medium text-[#a34848] transition hover:bg-[#fff4f4] dark:border-[#573838] dark:text-[#f2aaaa] dark:hover:bg-[#352323]"
      >
        Remover
      </Button>
    </div>
  );
}

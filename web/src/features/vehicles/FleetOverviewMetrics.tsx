import { Icon } from "../../components/Icon";
import type { IconName } from "../../components/Icon";
import type { FleetSummary, VehicleStatus } from "./types";

const statusLabels: Record<VehicleStatus, string> = {
  operational: "Operacionais",
  maintenance: "Em manutenção",
  inactive: "Inativos",
};

const statusColors: Record<VehicleStatus, string> = {
  operational: "#84ad45",
  maintenance: "#d4a23b",
  inactive: "#849087",
};

export function FleetOverviewMetrics({ summary }: { summary: FleetSummary }) {
  const counts = summary.statusCounts;
  const operationalEnd = summary.totalVehicles
    ? (counts.operational / summary.totalVehicles) * 100
    : 0;
  const maintenanceEnd = summary.totalVehicles
    ? ((counts.operational + counts.maintenance) / summary.totalVehicles) * 100
    : 0;
  const distribution = `conic-gradient(${statusColors.operational} 0% ${operationalEnd}%, ${statusColors.maintenance} ${operationalEnd}% ${maintenanceEnd}%, ${statusColors.inactive} ${maintenanceEnd}% 100%)`;

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Veículos na frota" value={summary.totalVehicles} detail="Total cadastrado" color="green" />
        <MetricCard label="Disponibilidade" value={`${summary.operationalRate}%`} detail="Percentual operacional" color="green" />
        <MetricCard label="Em manutenção" value={counts.maintenance} detail="Requerem acompanhamento" color="amber" />
        <MetricCard label="Inativos" value={counts.inactive} detail="Fora de operação" color="slate" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-2xl border border-[#e5eae2] bg-white p-5 sm:p-7 dark:border-[#303b33] dark:bg-[#19211b]">
          <div>
            <h2 className="text-lg font-semibold">Composição da frota</h2>
            <p className="mt-1 text-sm text-[#748078] dark:text-[#a7b2a9]">
              Veículos agrupados por status atual.
            </p>
          </div>
          <div className="mt-7 flex flex-col items-center gap-8 sm:flex-row sm:justify-around">
            <div
              className="relative flex size-52 shrink-0 items-center justify-center rounded-full"
              style={{ background: distribution }}
              role="img"
              aria-label={`Distribuição da frota: ${counts.operational} operacionais, ${counts.maintenance} em manutenção e ${counts.inactive} inativos`}
            >
              <div className="flex size-36 flex-col items-center justify-center rounded-full bg-white dark:bg-[#19211b]">
                <span className="text-3xl font-semibold">{summary.totalVehicles}</span>
                <span className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">veículos</span>
              </div>
            </div>
            <div className="w-full space-y-5 sm:max-w-xs">
              {(["operational", "maintenance", "inactive"] as const).map((status) => {
                const percent = summary.totalVehicles
                  ? Math.round((counts[status] / summary.totalVehicles) * 100)
                  : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="flex items-center gap-2 text-[#526056] dark:text-[#d9e1da]">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: statusColors[status] }}
                        />
                        {statusLabels[status]}
                      </span>
                      <span className="font-semibold">
                        {counts[status]}{" "}
                        <span className="font-normal text-[#879389]">({percent}%)</span>
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf0eb] dark:bg-[#303b33]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: statusColors[status],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e5eae2] bg-white p-5 sm:p-7 dark:border-[#303b33] dark:bg-[#19211b]">
          <h2 className="text-lg font-semibold">Resumo operacional</h2>
          <p className="mt-1 text-sm text-[#748078] dark:text-[#a7b2a9]">
            Leitura rápida da disponibilidade da frota.
          </p>
          <div className="mt-7 rounded-2xl bg-[#f3f6ef] p-5 dark:bg-[#202a21]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#526056] dark:text-[#d9e1da]">
                  Prontos para operação
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  {summary.operationalRate}%
                </p>
              </div>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#e3efd5] text-[#66883f] dark:bg-[#34452a] dark:text-[#c4f36b]">
                <Icon name="check" className="size-6" />
              </span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white dark:bg-[#151c17]">
              <div
                className="h-full rounded-full bg-[#84ad45] transition-all"
                style={{ width: `${summary.operationalRate}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-[#748078] dark:text-[#a7b2a9]">
              {counts.operational} de {summary.totalVehicles} veículos estão marcados como operacionais.
            </p>
          </div>
          <a
            href="/app"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#66883f] hover:underline dark:text-[#c4f36b]"
          >
            Ver cadastro de veículos
            <Icon name="arrow" className="size-4" />
          </a>
        </section>
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: number | string;
  detail: string;
  color: "green" | "amber" | "slate";
}) {
  const iconColor = {
    green: "bg-[#edf4e6] text-[#6d9144] dark:bg-[#293627] dark:text-[#c4f36b]",
    amber: "bg-[#fbf2df] text-[#a77a25] dark:bg-[#3a3020] dark:text-[#e5c16c]",
    slate: "bg-[#edf0ee] text-[#69776e] dark:bg-[#29312c] dark:text-[#b8c4bb]",
  }[color];
  const icon: IconName =
    color === "amber" ? "maintenance" : color === "slate" ? "fleet" : "chart";

  return (
    <article className="rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-[#303b33] dark:bg-[#19211b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[#748078] dark:text-[#a7b2a9]">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className={`flex size-10 items-center justify-center rounded-xl ${iconColor}`}>
          <Icon name={icon} className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-[#929c93] dark:text-[#879389]">{detail}</p>
    </article>
  );
}

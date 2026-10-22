import { Icon } from "../../components/Icon";
import type { VehicleStatusCounts } from "../vehicles/types";

export type FleetNavigationSection = "overview" | "vehicles" | "maintenance";

const sections: {
  id: FleetNavigationSection;
  label: string;
  href: string;
  icon: "chart" | "fleet" | "maintenance";
}[] = [
  { id: "overview", label: "Indicadores", href: "/app/overview", icon: "chart" },
  { id: "vehicles", label: "Veículos", href: "/app", icon: "fleet" },
  {
    id: "maintenance",
    label: "Manutenção",
    href: "/app?status=maintenance",
    icon: "maintenance",
  },
];

export function FleetNavigation({
  active,
  statusCounts,
}: {
  active: FleetNavigationSection;
  statusCounts?: VehicleStatusCounts;
}) {
  return (
    <nav aria-label="Gestão da frota" className="mt-10">
      <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.16em] text-[#97a198]">
        GESTÃO DA FROTA
      </p>
      <div className="space-y-1">
        {sections.map((section) => {
          const count =
            section.id === "maintenance"
              ? statusCounts?.maintenance
              : section.id === "vehicles" && statusCounts
                ? Object.values(statusCounts).reduce((total, value) => total + value, 0)
                : undefined;
          const isActive = active === section.id;

          return (
            <a
              key={section.id}
              href={section.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                isActive
                  ? "bg-[#edf4e6] font-semibold text-[#526f37] dark:bg-[#293627] dark:text-[#c4f36b]"
                  : "font-medium text-[#66736a] hover:bg-[#f3f6ef] dark:text-[#a7b2a9] dark:hover:bg-[#202a21]"
              }`}
            >
              <Icon name={section.icon} className="size-[18px] shrink-0" />
              <span className="flex-1">{section.label}</span>
              {count !== undefined && (
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs tabular-nums dark:bg-white/10">
                  {count}
                </span>
              )}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

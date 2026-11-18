import { useEffect, useState } from "react";
import { listDrivers } from "../drivers/api";
import type { Driver } from "../drivers/types";
import { listVehicles } from "../vehicles/api";
import type { Vehicle } from "../vehicles/types";
import { FuelRecordsPanel } from "./FuelRecordsPanel";
import { MaintenanceRecordsPanel } from "./MaintenanceRecordsPanel";
import { TiresPanel } from "./TiresPanel";

type DriverOption = Pick<Driver, "id" | "fullName" | "status">;

async function loadAllVehicles(): Promise<Vehicle[]> {
  const firstPage = await listVehicles(1, 100, "", "all");
  const vehicles = [...firstPage.items];
  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    vehicles.push(...(await listVehicles(page, 100, "", "all")).items);
  }
  return vehicles;
}

async function loadAllDrivers(): Promise<DriverOption[]> {
  const firstPage = await listDrivers(1, 100, "", "all");
  const drivers = [...firstPage.items];
  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    drivers.push(...(await listDrivers(page, 100, "", "all")).items);
  }
  return drivers.map(({ id, fullName, status }) => ({ id, fullName, status }));
}

export type MaintenanceTab = "preventive" | "fuel" | "maintenance" | "tires";

export function FleetRecords({
  readOnly,
  onChanged,
  activeTab,
}: {
  readOnly: boolean;
  onChanged: () => void;
  activeTab: MaintenanceTab;
}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [vehicleItems, driverItems] = await Promise.all([
          loadAllVehicles(),
          loadAllDrivers(),
        ]);
        if (active) {
          setVehicles(vehicleItems);
          setDrivers(driverItems);
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Não foi possível carregar os cadastros.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  function refresh() {
    setRefreshKey((current) => current + 1);
    onChanged();
  }

  const tabs = [
    { id: "fuel", label: "Abastecimentos e consumo" },
    { id: "maintenance", label: "Registros de manutenção" },
    { id: "tires", label: "Pneus e histórico" },
  ] as const;

  return (
    <section id="fleet-records" className="mt-5" aria-label="Registros da frota" hidden={activeTab === "preventive"}>
      {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      {loading ? (
        <p role="status" className="py-8 text-sm text-[#748078] dark:text-[#a7b2a9]">
          Carregando veículos e motoristas...
        </p>
      ) : error ? null : vehicles.length === 0 ? (
        <p className="rounded-2xl border border-[#e5eae2] bg-white p-5 text-sm dark:border-fleet-border dark:bg-fleet-raised">
          Cadastre um veículo para registrar abastecimentos, manutenção e pneus.
        </p>
      ) : (
        <>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              id={`fleet-records-panel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`fleet-records-tab-${tab.id}`}
              tabIndex={0}
              hidden={activeTab !== tab.id}
            >
              {tab.id === "fuel" && (
                <FuelRecordsPanel
                  vehicles={vehicles}
                  drivers={drivers}
                  readOnly={readOnly}
                  onChanged={refresh}
                  refreshKey={refreshKey}
                />
              )}
              {tab.id === "maintenance" && (
                <MaintenanceRecordsPanel
                  vehicles={vehicles}
                  readOnly={readOnly}
                  onChanged={refresh}
                  refreshKey={refreshKey}
                />
              )}
              {tab.id === "tires" && (
                <TiresPanel
                  vehicles={vehicles}
                  readOnly={readOnly}
                  onChanged={refresh}
                  refreshKey={refreshKey}
                />
              )}
            </div>
          ))}
        </>
      )}
    </section>
  );
}

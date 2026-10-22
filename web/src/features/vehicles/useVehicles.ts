import { useCallback, useEffect, useState } from "react";
import { deleteVehicle, listVehicles, saveVehicle } from "./api";
import {
  vehiclePageSize,
  type Vehicle,
  type VehicleDraft,
  type VehicleStatus,
  type VehicleStatusCounts,
} from "./types";

const emptyStatusCounts: VehicleStatusCounts = {
  operational: 0,
  maintenance: 0,
  inactive: 0,
};

export function useVehicles(
  enabled: boolean,
  page: number,
  setPage: (page: number) => void,
  query: string,
  status: "all" | VehicleStatus,
) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [statusCounts, setStatusCounts] = useState(emptyStatusCounts);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let active = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listVehicles(page, vehiclePageSize, query, status);
        if (!active) {
          return;
        }
        if (page > result.totalPages) {
          setPage(result.totalPages);
          return;
        }
        setVehicles(result.items);
        setStatusCounts(result.statusCounts);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);
      } catch {
        if (active) {
          setError("Não foi possível carregar a frota. Verifique se a API está disponível.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [enabled, page, query, refreshKey, setPage, status]);

  const refresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  const save = useCallback(
    async (draft: VehicleDraft, vehicleId?: number) => {
      setError(null);
      await saveVehicle(draft, vehicleId);
      refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (vehicle: Vehicle) => {
      setError(null);
      await deleteVehicle(vehicle.id);
      refresh();
    },
    [refresh],
  );

  return {
    vehicles,
    statusCounts,
    totalItems,
    totalPages,
    isLoading,
    error,
    setError,
    save,
    remove,
  };
}

import { useCallback, useEffect, useState } from "react";
import { deleteDriver, listDrivers, saveDriver } from "./api";
import {
  driverPageSize,
  type Driver,
  type DriverDraft,
  type DriverStatus,
  type DriverStatusCounts,
} from "./types";

const emptyStatusCounts: DriverStatusCounts = { active: 0, inactive: 0 };

export function useDrivers(
  enabled: boolean,
  page: number,
  setPage: (page: number) => void,
  query: string,
  status: "all" | DriverStatus,
) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [statusCounts, setStatusCounts] = useState(emptyStatusCounts);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listDrivers(page, driverPageSize, query, status);
        if (!active) return;
        if (page > result.totalPages) {
          setPage(result.totalPages);
          return;
        }
        setDrivers(result.items);
        setStatusCounts(result.statusCounts);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);
      } catch {
        if (active) {
          setError("Não foi possível carregar os motoristas. Verifique se a API está disponível.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [enabled, page, query, refreshKey, setPage, status]);

  const refresh = useCallback(() => setRefreshKey((current) => current + 1), []);
  const save = useCallback(async (draft: DriverDraft, driverId?: number) => {
    setError(null);
    await saveDriver(draft, driverId);
    refresh();
  }, [refresh]);
  const remove = useCallback(async (driver: Driver) => {
    setError(null);
    await deleteDriver(driver.id);
    refresh();
  }, [refresh]);

  return {
    drivers,
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

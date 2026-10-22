import { useCallback, useEffect, useRef, useState } from "react";
import { getFleetSummary } from "./api";
import type { FleetSummary } from "./types";

const refreshIntervalMs = 30_000;

export function useFleetSummary(enabled: boolean) {
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestInFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled || requestInFlight.current) {
      return;
    }

    requestInFlight.current = true;
    setIsRefreshing(true);
    try {
      setSummary(await getFleetSummary());
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível atualizar os indicadores da frota.",
      );
    } finally {
      requestInFlight.current = false;
      setIsRefreshing(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void refresh();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, refreshIntervalMs);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [enabled, refresh]);

  return { summary, error, isRefreshing, refresh };
}

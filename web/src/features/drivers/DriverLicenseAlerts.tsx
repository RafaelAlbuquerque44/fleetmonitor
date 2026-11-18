import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { listLicenseAlerts, type LicenseAlert } from "./api";

function formatDueDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}

export function DriverLicenseAlerts() {
  const [alerts, setAlerts] = useState<LicenseAlert[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const result = await listLicenseAlerts();
        if (active) {
          setAlerts(result);
          setError(null);
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Não foi possível carregar os alertas.");
        }
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <Card className="mt-8 p-5">
      <h2 className="text-lg font-semibold">Validade das CNHs</h2>
      <p className="mt-1 text-sm text-[#748078] dark:text-[#a7b2a9]">
        Habilitações de motoristas ativos vencidas ou com prazo nos próximos 30 dias.
      </p>
      {error && <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
      {!alerts && !error && <p role="status" className="mt-4 text-sm">Carregando alertas...</p>}
      {alerts?.length === 0 && !error && (
        <p className="mt-4 text-sm text-[#748078] dark:text-[#a7b2a9]">
          Nenhuma CNH pendente neste período.
        </p>
      )}
      {alerts && alerts.length > 0 && (
        <ul className="mt-4 divide-y divide-[#edf0eb] dark:divide-fleet-border">
          {alerts.map((alert) => (
            <li key={alert.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-semibold">CNH · {alert.name}</p>
                <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
                  Prazo: {formatDueDate(alert.dueAt)} · Nº {alert.id}
                </p>
              </div>
              <Link
                className="text-sm font-semibold text-[#526f37] hover:underline dark:text-[#c4f36b]"
                to={`/app/drivers?q=${encodeURIComponent(alert.name)}`}
              >
                Buscar motorista
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

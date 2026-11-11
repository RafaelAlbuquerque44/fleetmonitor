import { useEffect } from "react";
import { Icon } from "../components/Icon";
import { useCurrentUser } from "../features/auth/useCurrentUser";
import { FleetAppShell } from "../features/navigation/FleetAppShell";
import { FleetOverviewMetrics } from "../features/vehicles/FleetOverviewMetrics";
import { useFleetSummary } from "../features/vehicles/useFleetSummary";

export function FleetOverviewPage() {
  const { user, isLoading: isUserLoading, error: userError } = useCurrentUser();
  const {
    summary,
    error: summaryError,
    isRefreshing,
    refresh,
  } = useFleetSummary(user !== null);

  useEffect(() => {
    document.title = "Indicadores da frota — FleetMonitor";
    return () => {
      document.title = "FleetMonitor — Gestão inteligente de frotas";
    };
  }, []);

  return (
    <FleetAppShell
      active="overview"
      title="Indicadores"
      statusCounts={summary?.statusCounts}
      sidebarFooter={
        <div className="mt-auto space-y-3">
            <div className="rounded-2xl bg-[#f3f6ef] p-4 dark:bg-[#202a21]">
              <p className="text-xs font-semibold">Atualização automática</p>
              <p className="mt-1 text-xs leading-5 text-[#748078] dark:text-[#a7b2a9]">
                Os indicadores são atualizados a cada 30 segundos.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6ebe4] p-4 dark:border-[#303b33]">
              <p className="text-xs font-semibold">Frota em foco</p>
              <p className="mt-1 text-xs leading-5 text-[#748078] dark:text-[#a7b2a9]">
                Acesse veículos e manutenção sem sair do painel.
              </p>
            </div>
        </div>
      }
    >
          <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-[#779b4d] dark:text-[#c4f36b]">
                  CENTRAL DE INTELIGÊNCIA
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                  Indicadores da frota
                </h1>
                <p className="mt-2 text-sm text-[#748078] dark:text-[#a7b2a9]">
                  Acompanhe os veículos, motoristas e a situação atual da operação.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-[#748078] dark:text-[#a7b2a9]">
                  {summary
                    ? `Atualizado ${new Date(summary.refreshedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                    : "Aguardando dados"}
                </p>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  disabled={isRefreshing || !user}
                  aria-label="Atualizar indicadores agora"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#e1e7df] bg-white px-3 py-2.5 text-sm font-medium transition hover:bg-[#f5f7f3] disabled:cursor-wait disabled:opacity-60 dark:border-[#303b33] dark:bg-[#19211b] dark:hover:bg-[#202a21]"
                >
                  <Icon name="refresh" className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Atualizar</span>
                </button>
              </div>
            </div>

            {(summaryError || userError) && (
              <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {summaryError ?? userError}
              </p>
            )}

            {isUserLoading || (!summary && isRefreshing) ? (
              <p className="mt-10 text-sm text-[#748078] dark:text-[#a7b2a9]">
                Carregando indicadores da frota...
              </p>
            ) : !summary ? (
              <div className="mt-8 rounded-2xl border border-[#e5eae2] bg-white p-8 text-center dark:border-[#303b33] dark:bg-[#19211b]">
                <p className="text-sm text-[#748078] dark:text-[#a7b2a9]">
                  Os indicadores estarão disponíveis quando a API responder.
                </p>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="mt-4 text-sm font-semibold text-[#66883f] hover:underline dark:text-[#c4f36b]"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <>
                <FleetOverviewMetrics summary={summary} />
                <p className="mt-6 text-center text-xs text-[#879389] dark:text-[#879389]">
                  Os dados são agregados por empresa e atualizados automaticamente a cada 30 segundos.
                </p>
              </>
            )}
          </section>
    </FleetAppShell>
  );
}

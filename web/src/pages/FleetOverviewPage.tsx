import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { logout as logoutUser } from "../features/auth/api";
import { useCurrentUser } from "../features/auth/useCurrentUser";
import { FleetNavigation } from "../features/navigation/FleetNavigation";
import { FleetOverviewMetrics } from "../features/vehicles/FleetOverviewMetrics";
import { useFleetSummary } from "../features/vehicles/useFleetSummary";
import { getTheme } from "../lib/theme";

export function FleetOverviewPage() {
  const [theme, setTheme] = useState<"light" | "dark">(getTheme);
  const [logoutError, setLogoutError] = useState<string | null>(null);
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

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("theme", next);
    setTheme(next);
  }

  async function logout() {
    try {
      await logoutUser();
    } catch {
      setLogoutError("Não foi possível encerrar a sessão. Tente novamente.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f6f2] text-[#17221c] dark:bg-[#101612] dark:text-[#eff4ef]">
      <div className="min-h-screen lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#e6ebe4] bg-white px-5 py-7 dark:border-[#28332b] dark:bg-[#151c17] lg:flex lg:flex-col">
          <a href="/" className="flex items-center gap-2.5 px-2" aria-label="FleetMonitor, início">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#c4f36b] text-[#17221c]">
              <Icon name="fleet" className="size-6" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              fleet<span className="text-[#71963b] dark:text-[#c4f36b]">monitor</span>
            </span>
          </a>
          <FleetNavigation active="overview" statusCounts={summary?.statusCounts} />
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
        </aside>

        <div className="min-w-0">
          <header className="flex items-center justify-between border-b border-[#e6ebe4] bg-white px-5 py-4 dark:border-[#28332b] dark:bg-[#151c17] sm:px-8 lg:px-10">
            <a href="/" className="flex items-center gap-2.5 lg:hidden" aria-label="FleetMonitor, início">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#c4f36b] text-[#17221c]">
                <Icon name="fleet" className="size-5" />
              </span>
              <span className="font-semibold tracking-tight">
                fleet<span className="text-[#71963b] dark:text-[#c4f36b]">monitor</span>
              </span>
            </a>
            <div className="hidden text-sm text-[#748078] dark:text-[#a7b2a9] lg:block">
              Painel da empresa <span className="mx-2 text-[#cbd2ca]">/</span>{" "}
              <span className="font-medium text-[#17221c] dark:text-[#eff4ef]">Indicadores</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {user && (
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold">{user.companyName}</p>
                  <p className="text-xs text-[#849087]">
                    {user.readOnly ? "Acesso somente leitura" : user.email}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Ativar tema ${theme === "dark" ? "claro" : "escuro"}`}
                className="flex size-10 items-center justify-center rounded-xl border border-[#e1e7df] text-[#526056] transition hover:bg-[#f5f7f3] dark:border-[#303b33] dark:text-[#d9e1da] dark:hover:bg-[#1b241d]"
              >
                <Icon name={theme === "dark" ? "sun" : "moon"} className="size-[18px]" />
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e1e7df] px-3 py-2 text-sm font-medium text-[#526056] transition hover:bg-[#f5f7f3] dark:border-[#303b33] dark:text-[#d9e1da] dark:hover:bg-[#1b241d]"
              >
                <Icon name="logout" className="size-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </header>

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
                  Acompanhe a disponibilidade e a situação dos veículos da empresa.
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

            {(summaryError || userError || logoutError) && (
              <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {summaryError ?? userError ?? logoutError}
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
        </div>
      </div>
    </main>
  );
}

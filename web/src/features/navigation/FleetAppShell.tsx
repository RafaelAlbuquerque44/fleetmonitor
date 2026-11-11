import { useState, type PropsWithChildren, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { logout } from "../auth/api";
import { useCurrentUser } from "../auth/useCurrentUser";
import type { VehicleStatusCounts } from "../vehicles/types";
import { FleetNavigation, type FleetNavigationSection } from "./FleetNavigation";
import { useTheme } from "../../lib/theme";

export function FleetAppShell({
  active,
  title,
  statusCounts,
  sidebarFooter,
  children,
}: PropsWithChildren<{
  active: FleetNavigationSection;
  title: string;
  statusCounts?: VehicleStatusCounts;
  sidebarFooter?: ReactNode;
}>) {
  const { user } = useCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      setLogoutError("Não foi possível encerrar a sessão. Tente novamente.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f6f2] text-[#17221c] dark:bg-fleet-canvas dark:text-[#eff4ef]">
      <div className="min-h-screen lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#e6ebe4] bg-white px-5 py-7 dark:border-fleet-border dark:bg-fleet-surface lg:flex lg:flex-col">
          <Link to="/" className="flex items-center gap-2.5 px-2" aria-label="FleetMonitor, início">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#c4f36b] text-[#17221c]">
              <Icon name="fleet" className="size-6" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              fleet<span className="text-[#71963b] dark:text-[#c4f36b]">monitor</span>
            </span>
          </Link>
          <FleetNavigation active={active} statusCounts={statusCounts} />
          {user?.readOnly && (
            <div className="mt-auto rounded-2xl border border-[#e6ebe4] p-4 dark:border-fleet-border">
              <p className="text-xs font-semibold">Modo de demonstração</p>
              <p className="mt-1 text-xs leading-5 text-[#748078] dark:text-[#a7b2a9]">
                Esta conta permite consultar os dados, mas não alterá-los.
              </p>
            </div>
          )}
          {sidebarFooter}
        </aside>

        <div className="min-w-0">
          <header className="flex items-center justify-between border-b border-[#e6ebe4] bg-white px-5 py-4 dark:border-fleet-border dark:bg-fleet-surface sm:px-8 lg:px-10">
            <Link to="/" className="flex items-center gap-2.5 lg:hidden" aria-label="FleetMonitor, início">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#c4f36b] text-[#17221c]">
                <Icon name="fleet" className="size-5" />
              </span>
              <span className="font-semibold tracking-tight">
                fleet<span className="text-[#71963b] dark:text-[#c4f36b]">monitor</span>
              </span>
            </Link>
            <div className="hidden text-sm text-[#748078] dark:text-[#a7b2a9] lg:block">
              Painel da empresa <span className="mx-2 text-[#cbd2ca]">/</span>{" "}
              <span className="font-medium text-[#17221c] dark:text-[#eff4ef]">{title}</span>
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
              <span className="flex size-10 items-center justify-center rounded-full bg-[#e7efdf] text-sm font-semibold text-[#526f37] dark:bg-[#293627] dark:text-[#c4f36b]">
                {user?.companyName.slice(0, 1).toUpperCase() ?? "F"}
              </span>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Ativar tema ${theme === "dark" ? "claro" : "escuro"}`}
                className="flex size-10 items-center justify-center rounded-xl border border-[#e1e7df] text-[#526056] transition hover:bg-[#f5f7f3] dark:border-fleet-border dark:text-[#d9e1da] dark:hover:bg-fleet-raised"
              >
                <Icon name={theme === "dark" ? "sun" : "moon"} className="size-[18px]" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e1e7df] px-3 py-2 text-sm font-medium text-[#526056] transition hover:bg-[#f5f7f3] dark:border-fleet-border dark:text-[#d9e1da] dark:hover:bg-fleet-raised"
              >
                <Icon name="logout" className="size-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </header>
          {logoutError && (
            <p role="alert" className="mx-5 mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300 sm:mx-8 lg:mx-10">
              {logoutError}
            </p>
          )}
          {children}
        </div>
      </div>
    </main>
  );
}

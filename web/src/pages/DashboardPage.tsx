import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "../components/Icon";
import { logout as logoutUser } from "../features/auth/api";
import { useCurrentUser } from "../features/auth/useCurrentUser";
import {
  FleetNavigation,
  type FleetNavigationSection,
} from "../features/navigation/FleetNavigation";
import { DashboardStat, VehicleActions, VehicleStatusBadge } from "../features/vehicles/components";
import { useVehicles } from "../features/vehicles/useVehicles";
import { isVehicleStatus, vehiclePageSize, type Vehicle, type VehicleDraft, type VehicleStatus } from "../features/vehicles/types";
import { getTheme } from "../lib/theme";

function emptyVehicleDraft(): VehicleDraft {
  return {
    plate: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    status: "operational",
  };
}

export function DashboardPage() {
  const [theme, setTheme] = useState<"light" | "dark">(getTheme);
  const { user, isLoading, error: userError } = useCurrentUser();
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VehicleStatus>(() => {
    const status = new URLSearchParams(window.location.search).get("status");
    return status === "maintenance" ? "maintenance" : "all";
  });
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [draft, setDraft] = useState<VehicleDraft>(emptyVehicleDraft());
  const vehicleData = useVehicles(
    user !== null,
    page,
    setPage,
    query,
    statusFilter,
  );
  const {
    vehicles,
    statusCounts,
    totalItems,
    totalPages,
    isLoading: isVehiclesLoading,
  } = vehicleData;
  const error = actionError ?? vehicleData.error ?? userError;
  const activeNavigation: FleetNavigationSection =
    statusFilter === "maintenance" ? "maintenance" : "vehicles";
  const setError = (message: string | null) => {
    setActionError(message);
    vehicleData.setError(null);
  };

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("theme", next);
    setTheme(next);
  }

  function openCreateVehicle() {
    setEditingVehicle(null);
    setDraft(emptyVehicleDraft());
    setError(null);
    setIsVehicleFormOpen(true);
  }

  function openEditVehicle(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setDraft({
      plate: vehicle.plate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      status: vehicle.status,
    });
    setError(null);
    setIsVehicleFormOpen(true);
  }

  async function saveVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      await vehicleData.save(draft, editingVehicle?.id);
      setNotice(editingVehicle ? "Veículo atualizado com sucesso." : "Veículo cadastrado com sucesso.");
      setIsVehicleFormOpen(false);
    } catch (error) {
      setError(
        error instanceof TypeError
          ? "Não foi possível conectar à API para salvar o veículo."
          : error instanceof Error
            ? error.message
            : "Não foi possível salvar o veículo.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteVehicle(vehicle: Vehicle) {
    if (!window.confirm(`Deseja remover o veículo ${vehicle.plate}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setError(null);
    setNotice(null);
    try {
      await vehicleData.remove(vehicle);
      setNotice(`Veículo ${vehicle.plate} removido.`);
    } catch (error) {
      setError(
        error instanceof TypeError
          ? "Não foi possível conectar à API para remover o veículo."
          : error instanceof Error
            ? error.message
            : "Não foi possível remover o veículo.",
      );
    }
  }

  async function logout() {
    try {
      await logoutUser();
    } catch {
      setError("Não foi possível encerrar a sessão. Tente novamente.");
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
          <FleetNavigation active={activeNavigation} statusCounts={statusCounts} />
          <div className="mt-auto space-y-3">
            <div className="rounded-2xl bg-[#f3f6ef] p-4 dark:bg-[#202a21]">
              <p className="text-xs font-semibold">Gestão da operação</p>
              <p className="mt-1 text-xs leading-5 text-[#748078] dark:text-[#a7b2a9]">
                Acompanhe cadastros e status em um só lugar.
              </p>
            </div>
            {user?.readOnly && (
              <div className="rounded-2xl border border-[#e6ebe4] p-4 dark:border-[#303b33]">
                <p className="text-xs font-semibold">Modo de demonstração</p>
                <p className="mt-1 text-xs leading-5 text-[#748078] dark:text-[#a7b2a9]">
                  Esta conta permite consultar os dados, mas não alterá-los.
                </p>
              </div>
            )}
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
              <span className="font-medium text-[#17221c] dark:text-[#eff4ef]">Veículos</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {user && (
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold">{user.companyName}</p>
                  <p className="text-xs text-[#849087]">{user.email}</p>
                </div>
              )}
              <span className="flex size-10 items-center justify-center rounded-full bg-[#e7efdf] text-sm font-semibold text-[#526f37] dark:bg-[#293627] dark:text-[#c4f36b]">
                {user?.companyName.slice(0, 1).toUpperCase() ?? "F"}
              </span>
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

          <section id="veiculos" className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
            {error && !isVehicleFormOpen && (
              <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="mb-5 rounded-xl bg-[#edf4e6] px-4 py-3 text-sm text-[#526f37] dark:bg-[#293627] dark:text-[#c4f36b]">
                {notice}
              </p>
            )}

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-[#779b4d] dark:text-[#c4f36b]">
                  VISÃO GERAL
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                  Olá, {user?.companyName ?? "gestor"}.
                </h1>
                <p className="mt-2 text-sm text-[#748078] dark:text-[#a7b2a9]">
                  Acompanhe os veículos e a situação atual da sua frota.
                </p>
              </div>
              {!user?.readOnly && <button
                type="button"
                onClick={openCreateVehicle}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17221c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2b3b30] dark:bg-[#c4f36b] dark:text-[#17221c] dark:hover:bg-[#d2fb8d]"
              >
                <Icon name="plus" className="size-[18px]" />
                Cadastrar veículo
              </button>}
            </div>

            {isLoading ||
            (isVehiclesLoading && vehicles.length === 0 && totalItems === 0 && !error) ? (
              <p className="mt-10 text-sm text-[#748078] dark:text-[#a7b2a9]">
                Carregando dados da frota...
              </p>
            ) : error && !user ? (
              <p role="alert" className="mt-10 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : (
              <>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <DashboardStat
                    label="Total de veículos"
                    value={Object.values(statusCounts).reduce((sum, count) => sum + count, 0)}
                    icon="fleet"
                    detail="Veículos cadastrados"
                  />
                  <DashboardStat
                    label="Operacionais"
                    value={statusCounts.operational}
                    icon="check"
                    detail="Disponíveis para operação"
                    tone="green"
                  />
                  <DashboardStat
                    label="Em manutenção"
                    value={statusCounts.maintenance}
                    icon="maintenance"
                    detail="Precisam de acompanhamento"
                    tone="amber"
                  />
                  <DashboardStat
                    label="Inativos"
                    value={statusCounts.inactive}
                    icon="fuel"
                    detail="Fora de operação"
                    tone="slate"
                  />
                </div>

                <div
                  aria-busy={isVehiclesLoading}
                  className="mt-8 overflow-hidden rounded-2xl border border-[#e5eae2] bg-white dark:border-[#303b33] dark:bg-[#19211b]"
                >
                  <div className="flex flex-col gap-4 border-b border-[#edf0eb] p-5 dark:border-[#303b33] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                      <h2 className="text-lg font-semibold">Veículos da frota</h2>
                      <p className="mt-1 text-xs text-[#849087]">
                        {totalItems === 0 ? 0 : (page - 1) * vehiclePageSize + 1}
                        {"–"}
                        {Math.min(page * vehiclePageSize, totalItems)} de {totalItems} veículos
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <label className="relative">
                        <span className="sr-only">Buscar veículo</span>
                        <Icon name="search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b968d]" />
                        <input
                          value={query}
                          onChange={(event) => {
                            setQuery(event.target.value);
                            setPage(1);
                          }}
                          placeholder="Placa, marca, modelo ou ano"
                          className="w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#8eb94b] focus:ring-4 focus:ring-[#c4f36b]/20 dark:border-[#3b473d] dark:bg-[#131a15] sm:w-56"
                        />
                      </label>
                      <label>
                        <span className="sr-only">Filtrar por status</span>
                        <select
                          value={statusFilter}
                          onChange={(event) => {
                            const value = event.target.value;
                            if (
                              value === "all" ||
                              value === "operational" ||
                              value === "maintenance" ||
                              value === "inactive"
                            ) {
                              setStatusFilter(value);
                              setPage(1);
                            }
                          }}
                          className="w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 text-sm outline-none focus:border-[#8eb94b] dark:border-[#3b473d] dark:bg-[#131a15] sm:w-44"
                        >
                          <option value="all">Todos os status</option>
                          <option value="operational">Operacional</option>
                          <option value="maintenance">Em manutenção</option>
                          <option value="inactive">Inativo</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  {vehicles.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#edf4e6] text-[#6d9144] dark:bg-[#293627] dark:text-[#c4f36b]">
                        <Icon name="fleet" className="size-6" />
                      </span>
                      <h3 className="mt-4 font-semibold">
                        {totalItems === 0 && query.trim().length === 0 && statusFilter === "all"
                          ? "Sua frota começa aqui"
                          : "Nenhum veículo encontrado"}
                      </h3>
                      <p className="mx-auto mt-1 max-w-sm text-sm text-[#748078] dark:text-[#a7b2a9]">
                        {totalItems === 0 && query.trim().length === 0 && statusFilter === "all"
                          ? "Cadastre o primeiro veículo para começar a acompanhar sua operação."
                          : "Tente ajustar a busca ou selecionar outro status."}
                      </p>
                      {totalItems === 0 && query.trim().length === 0 && statusFilter === "all" && !user?.readOnly && (
                        <button
                          type="button"
                          onClick={openCreateVehicle}
                          className="mt-5 text-sm font-semibold text-[#66883f] hover:underline dark:text-[#c4f36b]"
                        >
                          Cadastrar primeiro veículo
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-[#f8faf7] text-xs font-medium text-[#77837a] dark:bg-[#151c17] dark:text-[#a7b2a9]">
                            <tr>
                              <th className="px-6 py-3.5">Veículo</th>
                              <th className="px-6 py-3.5">Placa</th>
                              <th className="px-6 py-3.5">Ano</th>
                              <th className="px-6 py-3.5">Status</th>
                              {!user?.readOnly && <th className="px-6 py-3.5 text-right">Ações</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#edf0eb] dark:divide-[#303b33]">
                            {vehicles.map((vehicle) => (
                              <tr key={vehicle.id} className="transition hover:bg-[#fbfcfa] dark:hover:bg-[#202a21]">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#edf4e6] text-[#6d9144] dark:bg-[#293627] dark:text-[#c4f36b]">
                                      <Icon name="fleet" className="size-5" />
                                    </span>
                                    <span>
                                      <span className="block font-semibold">{vehicle.make} {vehicle.model}</span>
                                      <span className="mt-0.5 block text-xs text-[#849087]">Veículo #{vehicle.id}</span>
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-medium tracking-wide">{vehicle.plate}</td>
                                <td className="px-6 py-4 text-[#66736a] dark:text-[#b1bbb2]">{vehicle.year}</td>
                                <td className="px-6 py-4"><VehicleStatusBadge status={vehicle.status} /></td>
                                {!user?.readOnly && <td className="px-6 py-4">
                                  <VehicleActions
                                    vehicle={vehicle}
                                    onEdit={openEditVehicle}
                                    onDelete={deleteVehicle}
                                  />
                                </td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="divide-y divide-[#edf0eb] md:hidden dark:divide-[#303b33]">
                        {vehicles.map((vehicle) => (
                          <article key={vehicle.id} className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4e6] text-[#6d9144] dark:bg-[#293627] dark:text-[#c4f36b]">
                                  <Icon name="fleet" className="size-5" />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold">{vehicle.make} {vehicle.model}</p>
                                  <p className="mt-1 text-xs text-[#849087]">{vehicle.plate} · {vehicle.year}</p>
                                </div>
                              </div>
                              <VehicleStatusBadge status={vehicle.status} />
                            </div>
                            {!user?.readOnly && <div className="mt-4 flex justify-end">
                              <VehicleActions
                                vehicle={vehicle}
                                onEdit={openEditVehicle}
                                onDelete={deleteVehicle}
                              />
                            </div>}
                          </article>
                        ))}
                      </div>
                    </>
                  )}
                  {totalItems > 0 && totalPages > 1 && (
                    <nav
                      aria-label="Paginação de veículos"
                      className="flex items-center justify-between gap-4 border-t border-[#edf0eb] px-5 py-4 dark:border-[#303b33] sm:px-6"
                    >
                      <p className="text-xs text-[#748078] dark:text-[#a7b2a9]">
                        Página {page} de {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPage((current) => Math.max(1, current - 1))}
                          disabled={page === 1 || isVehiclesLoading}
                          className="rounded-lg border border-[#dfe5dd] px-3 py-2 text-sm font-medium text-[#526056] transition hover:bg-[#f3f6ef] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3b473d] dark:text-[#d9e1da] dark:hover:bg-[#263226]"
                        >
                          Anterior
                        </button>
                        <button
                          type="button"
                          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                          disabled={page === totalPages || isVehiclesLoading}
                          className="rounded-lg border border-[#dfe5dd] px-3 py-2 text-sm font-medium text-[#526056] transition hover:bg-[#f3f6ef] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3b473d] dark:text-[#d9e1da] dark:hover:bg-[#263226]"
                        >
                          Próxima
                        </button>
                      </div>
                    </nav>
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        {isVehicleFormOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-[#101612]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isSaving) {
                setIsVehicleFormOpen(false);
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="vehicle-form-title"
              className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-[#19211b] sm:rounded-3xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-[#779b4d] dark:text-[#c4f36b]">
                    GESTÃO DE ATIVOS
                  </p>
                  <h2 id="vehicle-form-title" className="mt-2 text-2xl font-semibold tracking-tight">
                    {editingVehicle ? "Editar veículo" : "Cadastrar veículo"}
                  </h2>
                  <p className="mt-1 text-sm text-[#748078] dark:text-[#a7b2a9]">
                    Preencha os dados para manter o cadastro da frota atualizado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVehicleFormOpen(false)}
                  disabled={isSaving}
                  aria-label="Fechar formulário"
                  className="rounded-lg px-3 py-2 text-sm text-[#748078] hover:bg-[#f3f6ef] dark:hover:bg-[#263226]"
                >
                  Fechar
                </button>
              </div>

              {error && (
                <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              )}

              <form onSubmit={saveVehicle} className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Placa</span>
                  <input
                    required
                    maxLength={7}
                    pattern="[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}"
                    title="Informe uma placa válida com 7 caracteres."
                    value={draft.plate}
                    onChange={(event) => setDraft((current) => ({ ...current, plate: event.target.value }))}
                    placeholder="ABC1D23"
                    className="rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-4 py-3 text-sm uppercase outline-none focus:border-[#8eb94b] focus:ring-4 focus:ring-[#c4f36b]/20 dark:border-[#3b473d] dark:bg-[#131a15]"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Ano</span>
                  <input
                    required
                    type="number"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    value={draft.year}
                    onChange={(event) => setDraft((current) => ({ ...current, year: Number(event.target.value) }))}
                    className="rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-4 py-3 text-sm outline-none focus:border-[#8eb94b] focus:ring-4 focus:ring-[#c4f36b]/20 dark:border-[#3b473d] dark:bg-[#131a15]"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Marca</span>
                  <input
                    required
                    maxLength={100}
                    value={draft.make}
                    onChange={(event) => setDraft((current) => ({ ...current, make: event.target.value }))}
                    placeholder="Ex.: Fiat"
                    className="rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-4 py-3 text-sm outline-none focus:border-[#8eb94b] focus:ring-4 focus:ring-[#c4f36b]/20 dark:border-[#3b473d] dark:bg-[#131a15]"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Modelo</span>
                  <input
                    required
                    maxLength={100}
                    value={draft.model}
                    onChange={(event) => setDraft((current) => ({ ...current, model: event.target.value }))}
                    placeholder="Ex.: Ducato"
                    className="rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-4 py-3 text-sm outline-none focus:border-[#8eb94b] focus:ring-4 focus:ring-[#c4f36b]/20 dark:border-[#3b473d] dark:bg-[#131a15]"
                  />
                </label>
                <label className="flex flex-col gap-2 sm:col-span-2">
                  <span className="text-sm font-medium">Status</span>
                  <select
                    value={draft.status}
                    onChange={(event) => {
                      const status = event.target.value;
                      if (isVehicleStatus(status)) {
                        setDraft((current) => ({ ...current, status }));
                      }
                    }}
                    className="rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-4 py-3 text-sm outline-none focus:border-[#8eb94b] dark:border-[#3b473d] dark:bg-[#131a15]"
                  >
                    <option value="operational">Operacional</option>
                    <option value="maintenance">Em manutenção</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </label>
                <div className="mt-2 flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsVehicleFormOpen(false)}
                    disabled={isSaving}
                    className="rounded-xl border border-[#dfe5dd] px-5 py-3 text-sm font-semibold transition hover:bg-[#f6f8f4] disabled:opacity-60 dark:border-[#3b473d] dark:hover:bg-[#263226]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-[#17221c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2b3b30] disabled:cursor-wait disabled:opacity-60 dark:bg-[#c4f36b] dark:text-[#17221c] dark:hover:bg-[#d2fb8d]"
                  >
                    {isSaving ? "Salvando..." : editingVehicle ? "Salvar alterações" : "Cadastrar veículo"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

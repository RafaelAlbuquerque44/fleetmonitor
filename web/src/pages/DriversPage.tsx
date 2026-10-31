import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "../components/Icon";
import { logout as logoutUser } from "../features/auth/api";
import { useCurrentUser } from "../features/auth/useCurrentUser";
import { FleetNavigation } from "../features/navigation/FleetNavigation";
import {
  DriverActions,
  DriverIdentityIcon,
  DriverStatusBadge,
  formatCpf,
} from "../features/drivers/components";
import { useDrivers } from "../features/drivers/useDrivers";
import {
  driverLicenseCategories,
  driverPageSize,
  type Driver,
  type DriverDraft,
  type DriverStatus,
} from "../features/drivers/types";
import { getTheme } from "../lib/theme";

function emptyDriverDraft(): DriverDraft {
  return {
    fullName: "",
    cpf: "",
    licenseNumber: "",
    licenseCategory: "B",
    licenseExpiresAt: "",
    phone: "",
    status: "active",
  };
}

export function DriversPage() {
  const [theme, setTheme] = useState<"light" | "dark">(getTheme);
  const { user, isLoading: isUserLoading, error: userError } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DriverStatus>("all");
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState<DriverDraft>(emptyDriverDraft());
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const driverData = useDrivers(user !== null, page, setPage, query, statusFilter);
  const {
    drivers,
    statusCounts,
    totalItems,
    totalPages,
    isLoading,
  } = driverData;
  const error = actionError ?? driverData.error ?? userError;

  useEffect(() => {
    document.title = "Motoristas — FleetMonitor";
    return () => {
      document.title = "FleetMonitor — Gestão inteligente de frotas";
    };
  }, []);

  function setError(message: string | null) {
    setActionError(message);
    driverData.setError(null);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("theme", next);
    setTheme(next);
  }

  function openCreateDriver() {
    setEditingDriver(null);
    setDraft(emptyDriverDraft());
    setError(null);
    setIsFormOpen(true);
  }

  function openEditDriver(driver: Driver) {
    setEditingDriver(driver);
    setDraft({
      ...driver,
      phone: driver.phone ?? "",
    });
    setError(null);
    setIsFormOpen(true);
  }

  async function saveDriver(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      await driverData.save(
        { ...draft, cpf: draft.cpf.replace(/\D/g, ""), licenseNumber: draft.licenseNumber.replace(/\D/g, "") },
        editingDriver?.id,
      );
      setNotice(editingDriver ? "Motorista atualizado com sucesso." : "Motorista cadastrado com sucesso.");
      setIsFormOpen(false);
    } catch (saveError) {
      setError(
        saveError instanceof TypeError
          ? "Não foi possível conectar à API para salvar o motorista."
          : saveError instanceof Error
            ? saveError.message
            : "Não foi possível salvar o motorista.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeDriver(driver: Driver) {
    if (!window.confirm(`Deseja remover o cadastro de ${driver.fullName}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await driverData.remove(driver);
      setNotice(`Motorista ${driver.fullName} removido.`);
    } catch (removeError) {
      setError(
        removeError instanceof TypeError
          ? "Não foi possível conectar à API para remover o motorista."
          : removeError instanceof Error
            ? removeError.message
            : "Não foi possível remover o motorista.",
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
          <FleetNavigation active="drivers" />
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
              <span className="font-medium text-[#17221c] dark:text-[#eff4ef]">Motoristas</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {user && (
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold">{user.companyName}</p>
                  <p className="text-xs text-[#849087]">{user.email}</p>
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
            {error && !isFormOpen && (
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
                <p className="text-xs font-semibold tracking-[0.16em] text-[#779b4d] dark:text-[#c4f36b]">GESTÃO DA FROTA</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Motoristas</h1>
                <p className="mt-2 text-sm text-[#748078] dark:text-[#a7b2a9]">
                  Gerencie os motoristas e acompanhe a validade das habilitações.
                </p>
              </div>
              {!user?.readOnly && (
                <button
                  type="button"
                  onClick={openCreateDriver}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17221c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2b3b30] dark:bg-[#c4f36b] dark:text-[#17221c] dark:hover:bg-[#d2fb8d]"
                >
                  <Icon name="plus" className="size-[18px]" />
                  Cadastrar motorista
                </button>
              )}
            </div>

            {user?.readOnly && (
              <p className="mt-6 rounded-xl border border-[#e5eae2] bg-white px-4 py-3 text-sm text-[#748078] dark:border-[#303b33] dark:bg-[#19211b] dark:text-[#a7b2a9]">
                Esta conta permite consultar os dados, mas não alterá-los.
              </p>
            )}

            {isUserLoading || (isLoading && drivers.length === 0 && !error) ? (
              <p className="mt-10 text-sm text-[#748078] dark:text-[#a7b2a9]">Carregando motoristas...</p>
            ) : error && !user ? (
              <p role="alert" className="mt-10 text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : (
              <>
                <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <article className="rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-[#303b33] dark:bg-[#19211b]">
                    <p className="text-sm text-[#748078] dark:text-[#a7b2a9]">Total de motoristas</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight">{statusCounts.active + statusCounts.inactive}</p>
                    <p className="mt-3 text-xs text-[#929c93] dark:text-[#879389]">Cadastros da empresa</p>
                  </article>
                  <article className="rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-[#303b33] dark:bg-[#19211b]">
                    <p className="text-sm text-[#748078] dark:text-[#a7b2a9]">Ativos</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight">{statusCounts.active}</p>
                    <p className="mt-3 text-xs text-[#929c93] dark:text-[#879389]">Disponíveis para operação</p>
                  </article>
                  <article className="rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-[#303b33] dark:bg-[#19211b]">
                    <p className="text-sm text-[#748078] dark:text-[#a7b2a9]">Inativos</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight">{statusCounts.inactive}</p>
                    <p className="mt-3 text-xs text-[#929c93] dark:text-[#879389]">Fora de operação</p>
                  </article>
                </div>

                <div aria-busy={isLoading} className="mt-8 overflow-hidden rounded-2xl border border-[#e5eae2] bg-white dark:border-[#303b33] dark:bg-[#19211b]">
                  <div className="flex flex-col gap-4 border-b border-[#edf0eb] p-5 dark:border-[#303b33] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                      <h2 className="text-lg font-semibold">Motoristas cadastrados</h2>
                      <p className="mt-1 text-xs text-[#849087]">
                        {totalItems === 0 ? 0 : (page - 1) * driverPageSize + 1}–{Math.min(page * driverPageSize, totalItems)} de {totalItems} motoristas
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <label className="relative">
                        <span className="sr-only">Buscar motorista</span>
                        <Icon name="search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b968d]" />
                        <input
                          value={query}
                          onChange={(event) => {
                            setQuery(event.target.value);
                            setPage(1);
                          }}
                          placeholder="Nome, CPF, CNH ou telefone"
                          className="w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#8eb94b] focus:ring-4 focus:ring-[#c4f36b]/20 dark:border-[#3b473d] dark:bg-[#131a15] sm:w-56"
                        />
                      </label>
                      <label>
                        <span className="sr-only">Filtrar por status</span>
                        <select
                          value={statusFilter}
                          onChange={(event) => {
                            const value = event.target.value;
                            if (value === "all" || value === "active" || value === "inactive") {
                              setStatusFilter(value);
                              setPage(1);
                            }
                          }}
                          className="w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 text-sm outline-none focus:border-[#8eb94b] dark:border-[#3b473d] dark:bg-[#131a15] sm:w-44"
                        >
                          <option value="all">Todos os status</option>
                          <option value="active">Ativo</option>
                          <option value="inactive">Inativo</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  {drivers.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#edf4e6] text-[#6d9144] dark:bg-[#293627] dark:text-[#c4f36b]">
                        <Icon name="driver" className="size-6" />
                      </span>
                      <h3 className="mt-4 font-semibold">
                        {totalItems === 0 && query.trim() === "" && statusFilter === "all" ? "Nenhum motorista cadastrado" : "Nenhum motorista encontrado"}
                      </h3>
                      <p className="mx-auto mt-1 max-w-sm text-sm text-[#748078] dark:text-[#a7b2a9]">
                        {totalItems === 0 && query.trim() === "" && statusFilter === "all"
                          ? "Cadastre o primeiro motorista para manter os dados da operação organizados."
                          : "Tente ajustar a busca ou selecionar outro status."}
                      </p>
                      {totalItems === 0 && query.trim() === "" && statusFilter === "all" && !user?.readOnly && (
                        <button type="button" onClick={openCreateDriver} className="mt-5 text-sm font-semibold text-[#66883f] hover:underline dark:text-[#c4f36b]">
                          Cadastrar primeiro motorista
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-[#f8faf7] text-xs font-medium text-[#77837a] dark:bg-[#151c17] dark:text-[#a7b2a9]">
                            <tr>
                              <th className="px-6 py-3.5">Motorista</th>
                              <th className="px-6 py-3.5">CPF</th>
                              <th className="px-6 py-3.5">CNH</th>
                              <th className="px-6 py-3.5">Validade</th>
                              <th className="px-6 py-3.5">Status</th>
                              {!user?.readOnly && <th className="px-6 py-3.5 text-right">Ações</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#edf0eb] dark:divide-[#303b33]">
                            {drivers.map((driver) => (
                              <tr key={driver.id} className="transition hover:bg-[#fbfcfa] dark:hover:bg-[#202a21]">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <DriverIdentityIcon />
                                    <span>
                                      <span className="block font-semibold">{driver.fullName}</span>
                                      <span className="mt-0.5 block text-xs text-[#849087]">{driver.phone || "Sem telefone"}</span>
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-medium tracking-wide">{formatCpf(driver.cpf)}</td>
                                <td className="px-6 py-4 text-[#66736a] dark:text-[#b1bbb2]">{driver.licenseNumber} · {driver.licenseCategory}</td>
                                <td className="px-6 py-4 text-[#66736a] dark:text-[#b1bbb2]">{new Date(`${driver.licenseExpiresAt}T00:00:00`).toLocaleDateString("pt-BR")}</td>
                                <td className="px-6 py-4"><DriverStatusBadge status={driver.status} /></td>
                                {!user?.readOnly && <td className="px-6 py-4"><DriverActions driver={driver} onEdit={openEditDriver} onDelete={removeDriver} /></td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="divide-y divide-[#edf0eb] md:hidden dark:divide-[#303b33]">
                        {drivers.map((driver) => (
                          <article key={driver.id} className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <DriverIdentityIcon />
                                <div className="min-w-0">
                                  <p className="truncate font-semibold">{driver.fullName}</p>
                                  <p className="mt-1 text-xs text-[#849087]">{formatCpf(driver.cpf)}</p>
                                  <p className="mt-1 text-xs text-[#849087]">CNH {driver.licenseNumber} · {driver.licenseCategory}</p>
                                  <p className="mt-1 text-xs text-[#849087]">Validade: {new Date(`${driver.licenseExpiresAt}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                                </div>
                              </div>
                              <DriverStatusBadge status={driver.status} />
                            </div>
                            {!user?.readOnly && (
                              <div className="mt-4 flex justify-end">
                                <DriverActions driver={driver} onEdit={openEditDriver} onDelete={removeDriver} />
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    </>
                  )}
                  {totalItems > 0 && totalPages > 1 && (
                    <nav aria-label="Paginação de motoristas" className="flex items-center justify-between gap-4 border-t border-[#edf0eb] px-5 py-4 dark:border-[#303b33] sm:px-6">
                      <p className="text-xs text-[#748078] dark:text-[#a7b2a9]">Página {page} de {totalPages}</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1 || isLoading} className="rounded-lg border border-[#dfe5dd] px-3 py-2 text-sm font-medium text-[#526056] transition hover:bg-[#f3f6ef] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3b473d] dark:text-[#d9e1da] dark:hover:bg-[#263226]">Anterior</button>
                        <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages || isLoading} className="rounded-lg border border-[#dfe5dd] px-3 py-2 text-sm font-medium text-[#526056] transition hover:bg-[#f3f6ef] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3b473d] dark:text-[#d9e1da] dark:hover:bg-[#263226]">Próxima</button>
                      </div>
                    </nav>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#101612]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSaving) setIsFormOpen(false);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="driver-form-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-[#19211b] sm:rounded-3xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-[#779b4d] dark:text-[#c4f36b]">GESTÃO DE PESSOAS</p>
                <h2 id="driver-form-title" className="mt-2 text-2xl font-semibold tracking-tight">{editingDriver ? "Editar motorista" : "Cadastrar motorista"}</h2>
                <p className="mt-1 text-sm text-[#748078] dark:text-[#a7b2a9]">Informe os dados pessoais e da habilitação.</p>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving} aria-label="Fechar formulário" className="rounded-lg px-3 py-2 text-sm text-[#748078] hover:bg-[#f3f6ef] dark:hover:bg-[#263226]">Fechar</button>
            </div>
            {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
            <form onSubmit={saveDriver} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Nome completo</span>
                <input required minLength={2} maxLength={150} value={draft.fullName} onChange={(event) => setDraft({ ...draft, fullName: event.target.value })} autoFocus className="w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 text-sm outline-none focus:border-[#8eb94b] dark:border-[#3b473d] dark:bg-[#131a15]" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">CPF</span>
                  <input required inputMode="numeric" maxLength={14} placeholder="000.000.000-00" value={draft.cpf} onChange={(event) => setDraft({ ...draft, cpf: event.target.value })} className="w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 text-sm outline-none focus:border-[#8eb94b] dark:border-[#3b473d] dark:bg-[#131a15]" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Telefone <span className="font-normal text-[#849087]">(opcional)</span></span>
                  <input type="tel" maxLength={30} value={draft.phone ?? ""} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} className="w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 text-sm outline-none focus:border-[#8eb94b] dark:border-[#3b473d] dark:bg-[#131a15]" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Número da CNH</span>
                  <input required inputMode="numeric" maxLength={11} value={draft.licenseNumber} onChange={(event) => setDraft({ ...draft, licenseNumber: event.target.value })} className="w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 text-sm outline-none focus:border-[#8eb94b] dark:border-[#3b473d] dark:bg-[#131a15]" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Categoria</span>
                  <select value={draft.licenseCategory} onChange={(event) => setDraft({ ...draft, licenseCategory: event.target.value as DriverDraft["licenseCategory"] })} className="w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 text-sm outline-none focus:border-[#8eb94b] dark:border-[#3b473d] dark:bg-[#131a15]">
                    {driverLicenseCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Validade da CNH</span>
                  <input required type="date" value={draft.licenseExpiresAt} onChange={(event) => setDraft({ ...draft, licenseExpiresAt: event.target.value })} className="w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 text-sm outline-none focus:border-[#8eb94b] dark:border-[#3b473d] dark:bg-[#131a15]" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Status</span>
                  <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as DriverStatus })} className="w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 text-sm outline-none focus:border-[#8eb94b] dark:border-[#3b473d] dark:bg-[#131a15]">
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-[#edf0eb] pt-5 dark:border-[#303b33] sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving} className="rounded-xl border border-[#dfe5dd] px-4 py-2.5 text-sm font-medium text-[#526056] transition hover:bg-[#f3f6ef] disabled:opacity-60 dark:border-[#3b473d] dark:text-[#d9e1da] dark:hover:bg-[#263226]">Cancelar</button>
                <button type="submit" disabled={isSaving} className="rounded-xl bg-[#17221c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2b3b30] disabled:cursor-wait disabled:opacity-60 dark:bg-[#c4f36b] dark:text-[#17221c] dark:hover:bg-[#d2fb8d]">{isSaving ? "Salvando..." : editingDriver ? "Salvar alterações" : "Cadastrar motorista"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

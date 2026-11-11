import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../features/auth/useCurrentUser";
import {
  createCost,
  createMaintenance,
  listCosts,
  listMaintenance,
  updateMaintenance,
} from "../features/operations/api";
import {
  fleetCostCategories,
  fleetCostCategoryLabels,
  maintenanceStatuses,
  maintenanceStatusLabels,
  type FleetCost,
  type FleetCostDraft,
  type MaintenanceDraft,
  type MaintenanceOrder,
} from "../features/operations/types";
import { listVehicles } from "../features/vehicles/api";
import type { Vehicle } from "../features/vehicles/types";
import { FleetAppShell } from "../features/navigation/FleetAppShell";

type OperationsMode = "maintenance" | "costs";

function emptyMaintenanceDraft(): MaintenanceDraft {
  return {
    vehicleId: 0,
    description: "",
    status: "scheduled",
    scheduledAt: null,
    completedAt: null,
    costCents: null,
  };
}

function emptyCostDraft(): FleetCostDraft {
  return {
    vehicleId: 0,
    category: "fuel",
    description: "",
    amountCents: 0,
    occurredAt: new Date().toISOString().slice(0, 10),
  };
}

function parseCurrencyToCents(value: string, allowZero = false): number | null {
  const normalized = value.trim().replace(",", ".");
  const match = /^(\d{1,8})(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) {
    return null;
  }
  const whole = Number(match[1]);
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  const amount = whole * 100 + cents;
  return Number.isSafeInteger(amount) &&
    amount <= 2_147_483_647 &&
    (allowZero ? amount >= 0 : amount > 0)
    ? amount
    : null;
}

async function loadAllVehicles(): Promise<Vehicle[]> {
  const firstPage = await listVehicles(1, 100, "", "all");
  const vehicles = [...firstPage.items];
  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await listVehicles(page, 100, "", "all");
    vehicles.push(...result.items);
  }
  return vehicles;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}

function statusClass(status: MaintenanceOrder["status"]): string {
  return status === "completed"
    ? "bg-[#edf5e7] text-[#5f813e] dark:bg-[#293627] dark:text-[#c4f36b]"
    : status === "cancelled"
      ? "bg-[#edf0ee] text-[#68756c] dark:bg-[#29312c] dark:text-[#b8c4bb]"
      : "bg-[#fbf2df] text-[#98701f] dark:bg-[#3a3020] dark:text-[#e5c16c]";
}

export function OperationsPage({ mode }: { mode: OperationsMode }) {
  const { user } = useCurrentUser();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceOrder[]>([]);
  const [costs, setCosts] = useState<FleetCost[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [maintenanceDraft, setMaintenanceDraft] =
    useState<MaintenanceDraft>(emptyMaintenanceDraft());
  const [costDraft, setCostDraft] = useState<FleetCostDraft>(emptyCostDraft());
  const [maintenanceCost, setMaintenanceCost] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);

  useEffect(() => {
    document.title = `${mode === "maintenance" ? "Manutenção" : "Custos"} — FleetMonitor`;
    return () => {
      document.title = "FleetMonitor — Gestão inteligente de frotas";
    };
  }, [mode]);

  useEffect(() => {
    if (!user) {
      return;
    }
    let active = true;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        if (mode === "maintenance") {
          const [vehicleResult, result] = await Promise.all([
            loadAllVehicles(),
            listMaintenance(page),
          ]);
          if (!active) {
            return;
          }
          setVehicles(vehicleResult);
          setMaintenance(result.items);
          setTotalPages(result.totalPages);
        } else {
          const [vehicleResult, result] = await Promise.all([
            loadAllVehicles(),
            listCosts(page),
          ]);
          if (!active) {
            return;
          }
          setVehicles(vehicleResult);
          setCosts(result.items);
          setTotalPages(result.totalPages);
        }
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar os dados da operação.",
          );
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
  }, [mode, page, refreshKey, user]);

  async function submitMaintenance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const costCents = maintenanceCost
      ? parseCurrencyToCents(maintenanceCost, true)
      : null;
    if (maintenanceCost && costCents === null) {
      setError("Informe um custo válido, com até duas casas decimais.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payload = { ...maintenanceDraft, costCents };
      if (editingOrderId) {
        await updateMaintenance(editingOrderId, payload);
        setNotice("Manutenção atualizada com sucesso.");
      } else {
        await createMaintenance(payload);
        setNotice("Manutenção cadastrada com sucesso.");
      }
      setEditingOrderId(null);
      setMaintenanceDraft(emptyMaintenanceDraft());
      setMaintenanceCost("");
      setPage(1);
      setRefreshKey((current) => current + 1);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível salvar a manutenção.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function submitCost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountCents = parseCurrencyToCents(costAmount);
    if (amountCents === null) {
      setError("Informe um valor válido, com até duas casas decimais.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      await createCost({ ...costDraft, amountCents });
      setNotice("Custo registrado com sucesso.");
      setCostDraft(emptyCostDraft());
      setCostAmount("");
      setPage(1);
      setRefreshKey((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível registrar o custo.");
    } finally {
      setIsSaving(false);
    }
  }

  function editMaintenance(order: MaintenanceOrder) {
    setEditingOrderId(order.id);
    setMaintenanceDraft({
      vehicleId: order.vehicleId,
      description: order.description,
      status: order.status,
      scheduledAt: order.scheduledAt,
      completedAt: order.completedAt,
      costCents: order.costCents,
    });
    setMaintenanceCost(
      order.costCents === null ? "" : (order.costCents / 100).toFixed(2),
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const title = mode === "maintenance" ? "Manutenção" : "Custos da frota";

  return (
    <FleetAppShell active={mode} title={title}>
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[#779b4d] dark:text-[#c4f36b]">
              GESTÃO DA OPERAÇÃO
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#748078] dark:text-[#a7b2a9]">
              {mode === "maintenance"
                ? "Registre ordens de manutenção e acompanhe seu andamento por veículo."
                : "Registre despesas operacionais da frota com valores exatos em reais."}
            </p>
          </div>
          <nav
            aria-label="Domínios operacionais"
            className="flex gap-2 rounded-xl border border-[#e1e7df] bg-white p-1 dark:border-[#303b33] dark:bg-[#19211b]"
          >
            <Link
              to="/app/maintenance"
              aria-current={mode === "maintenance" ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${mode === "maintenance" ? "bg-[#edf4e6] text-[#526f37] dark:bg-[#293627] dark:text-[#c4f36b]" : "text-[#748078] dark:text-[#a7b2a9]"}`}
            >
              Manutenção
            </Link>
            <Link
              to="/app/costs"
              aria-current={mode === "costs" ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${mode === "costs" ? "bg-[#edf4e6] text-[#526f37] dark:bg-[#293627] dark:text-[#c4f36b]" : "text-[#748078] dark:text-[#a7b2a9]"}`}
            >
              Custos
            </Link>
          </nav>
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-6 rounded-xl bg-[#edf4e6] px-4 py-3 text-sm text-[#526f37] dark:bg-[#293627] dark:text-[#c4f36b]">
            {notice}
          </p>
        )}

        {mode === "maintenance" ? (
          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <section className="rounded-2xl border border-[#e5eae2] bg-white dark:border-[#303b33] dark:bg-[#19211b]">
              <div className="border-b border-[#edf0eb] px-5 py-4 dark:border-[#303b33]">
                <h2 className="font-semibold">Ordens de manutenção</h2>
                <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
                  Registros preservados para manter o histórico operacional.
                </p>
              </div>
              {isLoading ? (
                <p className="p-6 text-sm text-[#748078] dark:text-[#a7b2a9]" role="status">
                  Carregando manutenções...
                </p>
              ) : maintenance.length === 0 ? (
                <p className="p-6 text-sm text-[#748078] dark:text-[#a7b2a9]">
                  Nenhuma manutenção registrada.
                </p>
              ) : (
                <div className="divide-y divide-[#edf0eb] dark:divide-[#303b33]">
                  {maintenance.map((order) => (
                    <article key={order.id} className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{order.description}</p>
                          <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
                            {order.vehiclePlate} · Agendada: {formatDate(order.scheduledAt)}
                            {order.completedAt && ` · Concluída: ${formatDate(order.completedAt)}`}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(order.status)}`}>
                          {maintenanceStatusLabels[order.status]}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-[#748078] dark:text-[#a7b2a9]">
                          Custo: {order.costCents === null ? "—" : formatCurrency(order.costCents)}
                        </p>
                        {!user?.readOnly && (
                          <button
                            type="button"
                            onClick={() => editMaintenance(order)}
                            className="rounded-lg border border-[#e1e7df] px-3 py-1.5 text-xs font-medium text-[#526056] hover:bg-[#f3f6ef] dark:border-[#3b473d] dark:text-[#d9e1da] dark:hover:bg-[#263226]"
                          >
                            Atualizar
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#edf0eb] px-5 py-4 dark:border-[#303b33]">
                  <span className="text-xs text-[#748078] dark:text-[#a7b2a9]">
                    Página {page} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button type="button" disabled={page === 1 || isLoading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-[#dfe5dd] px-3 py-2 text-sm disabled:opacity-50 dark:border-[#3b473d]">Anterior</button>
                    <button type="button" disabled={page === totalPages || isLoading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-[#dfe5dd] px-3 py-2 text-sm disabled:opacity-50 dark:border-[#3b473d]">Próxima</button>
                  </div>
                </div>
              )}
            </section>

            {!user?.readOnly && (
              <form onSubmit={submitMaintenance} className="h-fit rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-[#303b33] dark:bg-[#19211b]">
                <h2 className="font-semibold">
                  {editingOrderId ? "Atualizar manutenção" : "Nova manutenção"}
                </h2>
                <div className="mt-5 space-y-4">
                  <label className="block text-sm font-medium">
                    Veículo
                    <select required value={maintenanceDraft.vehicleId || ""} onChange={(event) => setMaintenanceDraft({ ...maintenanceDraft, vehicleId: Number(event.target.value) })} className="mt-1.5 w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 dark:border-[#3b473d] dark:bg-[#131a15]">
                      <option value="" disabled>Selecione um veículo</option>
                      {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} · {vehicle.make} {vehicle.model}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Descrição
                    <textarea required maxLength={2000} value={maintenanceDraft.description} onChange={(event) => setMaintenanceDraft({ ...maintenanceDraft, description: event.target.value })} rows={3} className="mt-1.5 w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 dark:border-[#3b473d] dark:bg-[#131a15]" />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium">
                      Status
                      <select value={maintenanceDraft.status} onChange={(event) => setMaintenanceDraft({ ...maintenanceDraft, status: event.target.value as MaintenanceDraft["status"], completedAt: event.target.value === "completed" ? maintenanceDraft.completedAt : null })} className="mt-1.5 w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 dark:border-[#3b473d] dark:bg-[#131a15]">
                        {maintenanceStatuses.map((status) => <option key={status} value={status}>{maintenanceStatusLabels[status]}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-medium">
                      Data agendada
                      <input type="date" value={maintenanceDraft.scheduledAt ?? ""} onChange={(event) => setMaintenanceDraft({ ...maintenanceDraft, scheduledAt: event.target.value || null })} className="mt-1.5 w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 dark:border-[#3b473d] dark:bg-[#131a15]" />
                    </label>
                  </div>
                  {maintenanceDraft.status === "completed" && (
                    <label className="block text-sm font-medium">
                      Data de conclusão
                      <input required type="date" value={maintenanceDraft.completedAt ?? ""} onChange={(event) => setMaintenanceDraft({ ...maintenanceDraft, completedAt: event.target.value || null })} className="mt-1.5 w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 dark:border-[#3b473d] dark:bg-[#131a15]" />
                    </label>
                  )}
                  <label className="block text-sm font-medium">
                    Custo opcional (R$)
                    <input inputMode="decimal" placeholder="0,00" value={maintenanceCost} onChange={(event) => setMaintenanceCost(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 dark:border-[#3b473d] dark:bg-[#131a15]" />
                  </label>
                  <div className="flex gap-3">
                    <button type="submit" disabled={isSaving || vehicles.length === 0} className="flex-1 rounded-xl bg-[#17221c] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-[#c4f36b] dark:text-[#17221c]">
                      {isSaving ? "Salvando..." : editingOrderId ? "Salvar alterações" : "Cadastrar"}
                    </button>
                    {editingOrderId && (
                      <button type="button" onClick={() => { setEditingOrderId(null); setMaintenanceDraft(emptyMaintenanceDraft()); setMaintenanceCost(""); }} className="rounded-xl border border-[#dfe5dd] px-4 py-2.5 text-sm dark:border-[#3b473d]">
                        Cancelar
                      </button>
                    )}
                  </div>
                  {vehicles.length === 0 && !isLoading && (
                    <p className="text-xs text-[#a34848] dark:text-red-300">Cadastre um veículo antes de registrar uma manutenção.</p>
                  )}
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <section className="rounded-2xl border border-[#e5eae2] bg-white dark:border-[#303b33] dark:bg-[#19211b]">
              <div className="border-b border-[#edf0eb] px-5 py-4 dark:border-[#303b33]">
                <h2 className="font-semibold">Lançamentos de custos</h2>
                <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
                  Lançamentos são imutáveis para preservar o histórico financeiro.
                </p>
              </div>
              {isLoading ? (
                <p className="p-6 text-sm text-[#748078] dark:text-[#a7b2a9]" role="status">
                  Carregando custos...
                </p>
              ) : costs.length === 0 ? (
                <p className="p-6 text-sm text-[#748078] dark:text-[#a7b2a9]">
                  Nenhum custo registrado.
                </p>
              ) : (
                <div className="divide-y divide-[#edf0eb] dark:divide-[#303b33]">
                  {costs.map((cost) => (
                    <article key={cost.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
                      <div>
                        <p className="font-semibold">{cost.description}</p>
                        <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
                          {cost.vehiclePlate} · {fleetCostCategoryLabels[cost.category]} · {formatDate(cost.occurredAt)}
                        </p>
                      </div>
                      <p className="font-semibold tabular-nums">{formatCurrency(cost.amountCents)}</p>
                    </article>
                  ))}
                </div>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#edf0eb] px-5 py-4 dark:border-[#303b33]">
                  <span className="text-xs text-[#748078] dark:text-[#a7b2a9]">
                    Página {page} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button type="button" disabled={page === 1 || isLoading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-[#dfe5dd] px-3 py-2 text-sm disabled:opacity-50 dark:border-[#3b473d]">Anterior</button>
                    <button type="button" disabled={page === totalPages || isLoading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-[#dfe5dd] px-3 py-2 text-sm disabled:opacity-50 dark:border-[#3b473d]">Próxima</button>
                  </div>
                </div>
              )}
            </section>

            {!user?.readOnly && (
              <form onSubmit={submitCost} className="h-fit rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-[#303b33] dark:bg-[#19211b]">
                <h2 className="font-semibold">Registrar custo</h2>
                <div className="mt-5 space-y-4">
                  <label className="block text-sm font-medium">
                    Veículo
                    <select required value={costDraft.vehicleId || ""} onChange={(event) => setCostDraft({ ...costDraft, vehicleId: Number(event.target.value) })} className="mt-1.5 w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 dark:border-[#3b473d] dark:bg-[#131a15]">
                      <option value="" disabled>Selecione um veículo</option>
                      {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} · {vehicle.make} {vehicle.model}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Categoria
                    <select value={costDraft.category} onChange={(event) => setCostDraft({ ...costDraft, category: event.target.value as FleetCostDraft["category"] })} className="mt-1.5 w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 dark:border-[#3b473d] dark:bg-[#131a15]">
                      {fleetCostCategories.map((category) => <option key={category} value={category}>{fleetCostCategoryLabels[category]}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Descrição
                    <input required maxLength={500} value={costDraft.description} onChange={(event) => setCostDraft({ ...costDraft, description: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 dark:border-[#3b473d] dark:bg-[#131a15]" />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium">
                      Valor (R$)
                      <input required inputMode="decimal" placeholder="0,00" value={costAmount} onChange={(event) => setCostAmount(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 dark:border-[#3b473d] dark:bg-[#131a15]" />
                    </label>
                    <label className="block text-sm font-medium">
                      Data
                      <input required type="date" value={costDraft.occurredAt} onChange={(event) => setCostDraft({ ...costDraft, occurredAt: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 dark:border-[#3b473d] dark:bg-[#131a15]" />
                    </label>
                  </div>
                  <button type="submit" disabled={isSaving || vehicles.length === 0} className="w-full rounded-xl bg-[#17221c] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-[#c4f36b] dark:text-[#17221c]">
                    {isSaving ? "Salvando..." : "Registrar custo"}
                  </button>
                  {vehicles.length === 0 && !isLoading && (
                    <p className="text-xs text-[#a34848] dark:text-red-300">Cadastre um veículo antes de registrar um custo.</p>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

      </section>
    </FleetAppShell>
  );
}

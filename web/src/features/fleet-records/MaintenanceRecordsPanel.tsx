import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Vehicle } from "../vehicles/types";
import { RecordPagination, useRecordPagination } from "./RecordPagination";
import { analyzeMaintenance, type InsightSeverity, type MaintenanceAnalysis } from "./analytics";
import {
  createMaintenanceRecord,
  listMaintenanceRecords,
  updateMaintenanceRecord,
  type MaintenanceRecord,
  type MaintenanceRecordDraft,
  type MaintenanceRecordStatus,
} from "./api";

type Props = {
  vehicles: Vehicle[];
  readOnly: boolean;
  refreshKey: number;
  onChanged: () => void;
};

const statusLabels: Record<MaintenanceRecordStatus, string> = {
  open: "Aberta",
  in_progress: "Em andamento",
  waiting_part: "Aguardando peça",
  waiting_service: "Aguardando serviço",
  completed: "Concluída",
};

function localDateValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

const severityStyles: Record<InsightSeverity, string> = {
  critical: "border-[#f0c4bf] bg-[#fdf3f2] text-[#8c1d18] dark:border-[#5c2b27] dark:bg-[#2e1a18] dark:text-[#ffb4ab]",
  warning: "border-[#ecd9a8] bg-[#fdf8ea] text-[#7a5a12] dark:border-[#574a22] dark:bg-[#2d2616] dark:text-[#e5c16c]",
  info: "border-[#d7e3cc] bg-[#f4f4f4] text-[#456327] dark:border-fleet-border dark:bg-fleet-surface dark:text-[#c4f36b]",
};

const severityLabels: Record<InsightSeverity, string> = {
  critical: "Crítico",
  warning: "Atenção",
  info: "Informativo",
};

function MaintenanceAnalysisSection({ analysis }: { analysis: MaintenanceAnalysis }) {
  const cards = [
    { label: "Ocorrências abertas", value: String(analysis.openCount) },
    { label: "Prazos vencidos", value: String(analysis.overdueCount) },
    {
      label: "Tempo médio de resolução",
      value: analysis.averageResolutionDays === null
        ? "—"
        : `${analysis.averageResolutionDays.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dia(s)`,
    },
  ];
  return (
    <div className="min-w-0 space-y-4 lg:col-span-2">
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl bg-[#f7f7f7] p-4 dark:bg-[#20271f]">
            <p className="text-xs text-[#748078] dark:text-[#a7b2a9]">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
      <details className="rounded-xl bg-[#f7f7f7] p-4 dark:bg-[#20271f]">
        <summary className="cursor-pointer text-sm font-semibold">Ver análises e histórico por veículo</summary>
      <div className="mt-4">
        <h4 className="text-sm font-semibold">Análises e recomendações</h4>
        <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
          Geradas a partir do histórico de manutenção de cada veículo.
        </p>
        {analysis.insights.length === 0 ? (
          <p className="mt-3 rounded-xl border border-[#d7e3cc] bg-[#f4f4f4] px-3 py-2 text-sm text-[#456327] dark:border-fleet-border dark:bg-fleet-surface dark:text-[#c4f36b]">
            Nenhuma recomendação no momento: prazos em dia e sem recorrências.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {analysis.insights.slice(0, 8).map((insight) => (
              <li key={insight.id} className={`rounded-xl border px-3 py-2 text-xs ${severityStyles[insight.severity]}`}>
                <p className="font-semibold">
                  {insight.vehiclePlate} · {insight.title}
                  <span className="ml-2 font-normal opacity-80">({severityLabels[insight.severity]})</span>
                </p>
                <p className="mt-1 leading-5">{insight.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-4">
        <h4 className="text-sm font-semibold">Histórico por veículo</h4>
        <div className="mt-3 max-h-80 overflow-auto rounded-xl border border-[#e8ece6] dark:border-fleet-border" tabIndex={0} aria-label="Tabela de histórico por veículo">
          <table className="w-full min-w-[34rem] text-left text-xs">
            <thead className="bg-[#f7f7f7] text-[#748078] dark:bg-[#20271f] dark:text-[#a7b2a9]">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Veículo</th>
                <th scope="col" className="px-3 py-2 font-medium">Ocorrências</th>
                <th scope="col" className="px-3 py-2 font-medium">Abertas</th>
                <th scope="col" className="px-3 py-2 font-medium">Última</th>
                <th scope="col" className="px-3 py-2 font-medium">Resolução média</th>
                <th scope="col" className="px-3 py-2 font-medium">Peças já utilizadas</th>
              </tr>
            </thead>
            <tbody>
              {analysis.history.map((item) => (
                <tr key={item.vehicleId} className="border-t border-[#e8ece6] dark:border-fleet-border">
                  <th scope="row" className="px-3 py-2 font-medium">{item.vehiclePlate}</th>
                  <td className="px-3 py-2">{item.total}</td>
                  <td className="px-3 py-2">{item.open}</td>
                  <td className="px-3 py-2">{new Date(`${item.lastOccurredAt}T00:00:00`).toLocaleDateString("pt-BR")}</td>
                  <td className="px-3 py-2">{item.averageResolutionDays === null ? "—" : `${item.averageResolutionDays.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dia(s)`}</td>
                  <td className="px-3 py-2">{item.parts.length === 0 ? "—" : item.parts.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </details>
    </div>
  );
}

export function MaintenanceRecordsPanel({ vehicles, readOnly, refreshKey, onChanged }: Props) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState(String(vehicles[0]?.id ?? ""));
  const [problem, setProblem] = useState("");
  const [responsible, setResponsible] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [partsUsed, setPartsUsed] = useState("");
  const [status, setStatus] = useState<MaintenanceRecordStatus>("open");
  const [occurredAt, setOccurredAt] = useState(localDateValue);
  const [completedAt, setCompletedAt] = useState("");
  const problemInput = useRef<HTMLTextAreaElement>(null);
  const analysis = useMemo(() => analyzeMaintenance(records, localDateValue()), [records]);
  const pagination = useRecordPagination(records);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await listMaintenanceRecords();
        if (active) setRecords(result);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar as ocorrências.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [refreshKey, refresh]);

  function resetForm() {
    setEditing(null);
    setVehicleId(String(vehicles[0]?.id ?? ""));
    setProblem("");
    setResponsible("");
    setDueAt("");
    setPartsUsed("");
    setStatus("open");
    setOccurredAt(localDateValue());
    setCompletedAt("");
  }

  function editRecord(record: MaintenanceRecord) {
    setEditing(record.id);
    setVehicleId(String(record.vehicleId));
    setProblem(record.problem);
    setResponsible(record.responsible);
    setDueAt(record.dueAt ?? "");
    setPartsUsed(record.partsUsed ?? "");
    setStatus(record.status);
    setOccurredAt(toDateInputValue(record.occurredAt));
    setCompletedAt(record.completedAt ? toDateInputValue(record.completedAt) : "");
    setError(null);
    problemInput.current?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const draft: MaintenanceRecordDraft = {
      vehicleId: Number(vehicleId),
      problem: problem.trim(),
      responsible: responsible.trim(),
      dueAt: dueAt || null,
      partsUsed: partsUsed.trim() || null,
      status,
      occurredAt,
      completedAt: status === "completed" ? completedAt : null,
    };
    try {
      if (editing === null) {
        await createMaintenanceRecord(draft);
      } else {
        await updateMaintenanceRecord(editing, draft);
      }
      resetForm();
      setRefresh((current) => current + 1);
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar a ocorrência.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid grid-cols-1 gap-5 rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-fleet-border dark:bg-fleet-raised lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
      {!loading && records.length > 0 && <MaintenanceAnalysisSection analysis={analysis} />}
      <div>
        <h3 className="text-lg font-semibold">Registros de manutenção</h3>
        <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
          Acompanhe problemas, responsáveis, prazos, peças e o estado de cada ocorrência.
        </p>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        {loading ? (
          <p role="status" className="py-5 text-sm text-[#748078] dark:text-[#a7b2a9]">Carregando ocorrências...</p>
        ) : error && records.length === 0 ? null : records.length === 0 ? (
          <p className="py-5 text-sm text-[#748078] dark:text-[#a7b2a9]">Nenhuma ocorrência registrada.</p>
        ) : (
          <>
          <ul className="mt-3">
            {pagination.items.map((record) => (
              <li key={record.id} className="flex flex-col gap-3 border-t border-[#e8ece6] py-3 text-sm dark:border-fleet-border sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">{record.vehiclePlate} · {record.problem}</p>
                  <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
                    {statusLabels[record.status]} · responsável: {record.responsible}
                    {record.dueAt && ` · prazo: ${new Date(`${record.dueAt}T00:00:00`).toLocaleDateString("pt-BR")}`}
                  </p>
                  <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
                    Início: {new Date(`${record.occurredAt}T00:00:00`).toLocaleDateString("pt-BR")}
                    {record.completedAt && ` · finalização: ${new Date(`${record.completedAt.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR")}`}
                  </p>
                  {record.partsUsed && <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">Peças: {record.partsUsed}</p>}
                </div>
                {!readOnly && <button type="button" onClick={() => editRecord(record)} className="self-start rounded-lg border border-[#dce3da] px-3 py-1.5 text-xs font-medium hover:bg-[#f7f7f7] dark:border-fleet-border dark:hover:bg-[#20271f]">Editar</button>}
              </li>
            ))}
          </ul>
          <RecordPagination label="ocorrências" page={pagination.page} totalPages={pagination.totalPages} onPageChange={pagination.setPage} />
          </>
        )}
      </div>
      {!readOnly && (
        <form onSubmit={submit} className="space-y-3 rounded-xl bg-[#f7f7f7] p-4 dark:bg-[#20271f]">
          <h4 className="text-sm font-semibold">{editing === null ? "Registrar ocorrência" : "Atualizar ocorrência"}</h4>
          <label className="block text-xs font-medium">
            Veículo
            <select required disabled={editing !== null} value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm disabled:opacity-70 dark:border-fleet-border dark:bg-fleet-base">
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} · {vehicle.make} {vehicle.model}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium">Problema / serviço<textarea ref={problemInput} required maxLength={2000} value={problem} onChange={(event) => setProblem(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
          <label className="block text-xs font-medium">Responsável<input required maxLength={160} value={responsible} onChange={(event) => setResponsible(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
          <label className="block text-xs font-medium">Estado<select value={status} onChange={(event) => setStatus(event.target.value as MaintenanceRecordStatus)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium">Início<input required type="date" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
            <label className="block text-xs font-medium">Prazo<input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
          </div>
          {status === "completed" && <label className="block text-xs font-medium">Conclusão<input required min={occurredAt} type="date" value={completedAt} onChange={(event) => setCompletedAt(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>}
          <label className="block text-xs font-medium">Peças utilizadas<input maxLength={2000} value={partsUsed} onChange={(event) => setPartsUsed(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-[#c4f36b] px-4 py-2.5 text-sm font-semibold text-[#1d2819] disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Salvando..." : editing === null ? "Salvar ocorrência" : "Atualizar ocorrência"}</button>
            {editing !== null && <button type="button" onClick={resetForm} className="rounded-lg border border-[#dce3da] px-3 text-sm dark:border-fleet-border">Cancelar</button>}
          </div>
        </form>
      )}
      {readOnly && <p className="self-center text-sm text-[#748078] dark:text-[#a7b2a9]">Perfil somente leitura: edição desabilitada.</p>}
    </section>
  );
}

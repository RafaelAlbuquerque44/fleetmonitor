import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Vehicle } from "../vehicles/types";
import { RecordPagination, useRecordPagination } from "./RecordPagination";
import {
  analyzeTire,
  standardTireLifeKm,
  summarizeTires,
  tireAttentionRatio,
  tireEarlyReplacementRatio,
  tireStateLabels,
  type TireFleetSummary,
  type TireLifespanState,
} from "./analytics";
import {
  createTire,
  createTireEvent,
  listTires,
  type Tire,
  type TireEventDraft,
  type TireEventType,
} from "./api";

type Props = {
  vehicles: Vehicle[];
  readOnly: boolean;
  refreshKey: number;
  onChanged: () => void;
};

const eventLabels: Record<TireEventType, string> = {
  installation: "Instalação",
  problem: "Problema",
  rotation: "Rodízio",
  inspection: "Inspeção",
  replacement: "Substituição",
};

const eventTypes: TireEventType[] = ["problem", "rotation", "inspection"];

function localDateValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

const stateStyles: Record<TireLifespanState, string> = {
  ok: "bg-[#ebebeb] text-[#4f6f2c] dark:bg-fleet-highlight dark:text-[#c4f36b]",
  attention: "bg-[#fdf3d6] text-[#7a5a12] dark:bg-[#3a3020] dark:text-[#e5c16c]",
  exceeded: "bg-[#fdecea] text-[#b3261e] dark:bg-[#3a1f1c] dark:text-[#ffb4ab]",
  "early-replacement": "bg-[#fdecea] text-[#b3261e] dark:bg-[#3a1f1c] dark:text-[#ffb4ab]",
  "replaced-on-time": "bg-[#edf0ee] text-[#526056] dark:bg-fleet-highlight dark:text-[#b8c4bb]",
  "replaced-over-limit": "bg-[#fdf3d6] text-[#7a5a12] dark:bg-[#3a3020] dark:text-[#e5c16c]",
};

function barColor(state: TireLifespanState) {
  return state === "exceeded" || state === "early-replacement"
    ? "bg-[#d9534f]"
    : state === "attention" || state === "replaced-over-limit"
      ? "bg-[#e0a82e]"
      : "bg-[#84ad45]";
}

function TireSummary({ summary }: { summary: TireFleetSummary }) {
  const cards = [
    { label: "Pneus em uso", value: String(summary.active) },
    { label: "Pneus substituídos", value: String(summary.replaced) },
    { label: "Alertas de desgaste", value: String(summary.alerts) },
    {
      label: "Vida média dos substituídos",
      value: summary.averageReplacedKm === null
        ? "—"
        : `${Math.round(summary.averageReplacedKm).toLocaleString("pt-BR")} km`,
    },
  ];
  return (
    <div className="lg:col-span-2">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl bg-[#f7f7f7] p-4 dark:bg-[#20271f]">
            <p className="text-xs text-[#748078] dark:text-[#a7b2a9]">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[#748078] dark:text-[#a7b2a9]">
        Vida útil de referência: {standardTireLifeKm.toLocaleString("pt-BR")} km. Alerta a partir de {Math.round(tireAttentionRatio * 100)}% de uso; troca antes de {Math.round(tireEarlyReplacementRatio * 100)}% é marcada como antecipada.
        {summary.byBrand.length > 0 && (
          <> Média por marca: {summary.byBrand.map((item) => `${item.brand} ${Math.round(item.averageKm).toLocaleString("pt-BR")} km (${item.replaced})`).join(" · ")}.</>
        )}
      </p>
    </div>
  );
}

function TireCard({ tire }: { tire: Tire }) {
  const lifespan = analyzeTire(tire, localDateValue());
  return (
    <li className="border-t border-[#e8ece6] py-3 text-sm dark:border-fleet-border">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium">{tire.vehiclePlate} · {tire.position} · {tire.brand}</p>
          <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
            {tire.removedAt ? "Substituído" : "Em uso"} desde {new Date(`${tire.installedAt}T00:00:00`).toLocaleDateString("pt-BR")}
            {" · "}{tire.usageKm.toLocaleString("pt-BR")} km
            {tire.removedAt && ` · até ${new Date(`${tire.removedAt}T00:00:00`).toLocaleDateString("pt-BR")}`}
          </p>
          <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
            {lifespan.daysInUse} dia(s) de uso
            {lifespan.kmPerMonth !== null && ` · ${Math.round(lifespan.kmPerMonth).toLocaleString("pt-BR")} km/mês`}
            {!tire.removedAt && ` · restam ${lifespan.remainingKm.toLocaleString("pt-BR")} km`}
            {lifespan.problemCount > 0 && ` · ${lifespan.problemCount} problema(s)`}
          </p>
        </div>
        <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${stateStyles[lifespan.state]}`}>
          {tireStateLabels[lifespan.state]}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#edf0eb] dark:bg-fleet-border"
        role="progressbar"
        aria-label={`Vida útil consumida do pneu ${tire.position} de ${tire.vehiclePlate}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, Math.round(lifespan.usagePercent))}
      >
        <div className={`h-full rounded-full ${barColor(lifespan.state)}`} style={{ width: `${Math.min(100, lifespan.usagePercent)}%` }} />
      </div>
      <p className="mt-1 text-xs text-[#879389]">{Math.round(lifespan.usagePercent)}% da vida útil de referência</p>
      {tire.events.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-semibold text-[#526f37] dark:text-[#c4f36b]">Ver histórico ({tire.events.length})</summary>
        <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto border-l-2 border-[#c4f36b] pl-3" tabIndex={0} aria-label={`Histórico do pneu ${tire.position} de ${tire.vehiclePlate}`}>
          {tire.events.map((event) => (
            <li key={event.id} className="text-xs text-[#748078] dark:text-[#a7b2a9]">
              <span className="font-medium">{eventLabels[event.type]}</span>
              {" · "}{new Date(`${event.occurredAt}T00:00:00`).toLocaleDateString("pt-BR")}
              {" · "}{event.odometerKm.toLocaleString("pt-BR")} km
              {" · "}{event.description}
            </li>
          ))}
        </ul>
        </details>
      )}
    </li>
  );
}

export function TiresPanel({ vehicles, readOnly, refreshKey, onChanged }: Props) {
  const [tires, setTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [vehicleId, setVehicleId] = useState(String(vehicles[0]?.id ?? ""));
  const [position, setPosition] = useState("");
  const [brand, setBrand] = useState("");
  const [installedAt, setInstalledAt] = useState(localDateValue);
  const [installedOdometerKm, setInstalledOdometerKm] = useState("");
  const [selectedTireId, setSelectedTireId] = useState("");
  const [eventType, setEventType] = useState<TireEventType>("problem");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(localDateValue);
  const [eventOdometerKm, setEventOdometerKm] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await listTires();
        if (active) {
          setTires(result);
          setSelectedTireId((current) =>
            result.some((tire) => String(tire.id) === current && tire.removedAt === null)
              ? current
              : String(result.find((tire) => tire.removedAt === null)?.id ?? ""),
          );
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar o histórico de pneus.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [refreshKey, refresh]);

  async function submitTire(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const odometer = Number(installedOdometerKm);
    if (!Number.isSafeInteger(odometer) || odometer < 0) {
      setError("Informe uma quilometragem de instalação válida.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createTire({
        vehicleId: Number(vehicleId),
        position: position.trim(),
        brand: brand.trim(),
        installedAt,
        installedOdometerKm: odometer,
      });
      setBrand("");
      setPosition("");
      setInstalledOdometerKm("");
      setRefresh((current) => current + 1);
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível registrar o pneu.");
    } finally {
      setSaving(false);
    }
  }

  async function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const odometer = Number(eventOdometerKm);
    if (!Number.isSafeInteger(odometer) || odometer < 0 || !selectedTireId) {
      setError("Selecione um pneu ativo e informe uma quilometragem válida.");
      return;
    }
    const draft: TireEventDraft = {
      type: eventType,
      description: description.trim(),
      occurredAt: eventDate,
      odometerKm: odometer,
    };
    setSaving(true);
    setError(null);
    try {
      await createTireEvent(Number(selectedTireId), draft);
      setDescription("");
      setEventOdometerKm("");
      setRefresh((current) => current + 1);
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível registrar o evento do pneu.");
    } finally {
      setSaving(false);
    }
  }

  const activeTires = tires.filter((tire) => tire.removedAt === null);
  const tireSummary = useMemo(() => summarizeTires(tires, localDateValue()), [tires]);
  const sortedTires = useMemo(() => {
    const today = localDateValue();
    const priority: Record<TireLifespanState, number> = {
      exceeded: 0,
      "early-replacement": 1,
      attention: 2,
      "replaced-over-limit": 3,
      ok: 4,
      "replaced-on-time": 5,
    };
    return [...tires].sort((a, b) => priority[analyzeTire(a, today).state] - priority[analyzeTire(b, today).state]);
  }, [tires]);
  const pagination = useRecordPagination(sortedTires);

  return (
    <section className="grid grid-cols-1 gap-5 rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-fleet-border dark:bg-fleet-raised lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
      {!loading && tires.length > 0 && <TireSummary summary={tireSummary} />}
      <div>
        <h3 className="text-lg font-semibold">Pneus e histórico</h3>
        <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
          A quilometragem de uso considera os abastecimentos registrados para o veículo.
        </p>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        {loading ? (
          <p role="status" className="py-5 text-sm text-[#748078] dark:text-[#a7b2a9]">Carregando pneus...</p>
        ) : error && tires.length === 0 ? null : tires.length === 0 ? (
          <p className="py-5 text-sm text-[#748078] dark:text-[#a7b2a9]">Nenhum pneu registrado.</p>
        ) : (
          <>
            <ul className="mt-3">
              {pagination.items.map((tire) => <TireCard key={tire.id} tire={tire} />)}
            </ul>
            <RecordPagination label="pneus" page={pagination.page} totalPages={pagination.totalPages} onPageChange={pagination.setPage} />
          </>
        )}
      </div>
      {!readOnly && (
        <div className="space-y-4">
          <details className="rounded-xl bg-[#f7f7f7] p-4 dark:bg-[#20271f]">
          <summary className="cursor-pointer text-sm font-semibold">Instalar ou substituir pneu</summary>
          <form onSubmit={submitTire} className="mt-4 space-y-3">
            <label className="block text-xs font-medium">
              Veículo
              <select required value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base">
                {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} · {vehicle.make} {vehicle.model}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium">Posição<input required maxLength={100} placeholder="Ex.: dianteiro esquerdo" value={position} onChange={(event) => setPosition(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
            <label className="block text-xs font-medium">Marca<input required maxLength={100} value={brand} onChange={(event) => setBrand(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium">Instalação<input required type="date" value={installedAt} onChange={(event) => setInstalledAt(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
              <label className="block text-xs font-medium">Quilometragem<input required min="0" step="1" type="number" value={installedOdometerKm} onChange={(event) => setInstalledOdometerKm(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
            </div>
            <button type="submit" disabled={saving} className="w-full rounded-lg bg-[#c4f36b] px-4 py-2.5 text-sm font-semibold text-[#1d2819] disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Salvando..." : "Salvar instalação"}</button>
          </form>
          </details>

          {activeTires.length > 0 && (
            <details className="rounded-xl bg-[#f7f7f7] p-4 dark:bg-[#20271f]">
            <summary className="cursor-pointer text-sm font-semibold">Registrar evento</summary>
            <form onSubmit={submitEvent} className="mt-4 space-y-3">
              <label className="block text-xs font-medium">
                Pneu
                <select required value={selectedTireId} onChange={(event) => setSelectedTireId(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base">
                  {activeTires.map((tire) => <option key={tire.id} value={tire.id}>{tire.vehiclePlate} · {tire.position} · {tire.brand}</option>)}
                </select>
              </label>
              <label className="block text-xs font-medium">Evento<select value={eventType} onChange={(event) => setEventType(event.target.value as TireEventType)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base">{eventTypes.map((type) => <option key={type} value={type}>{eventLabels[type]}</option>)}</select></label>
              <label className="block text-xs font-medium">Descrição<textarea required maxLength={2000} rows={2} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-medium">Data<input required type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
                <label className="block text-xs font-medium">Quilometragem<input required min="0" step="1" type="number" value={eventOdometerKm} onChange={(event) => setEventOdometerKm(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
              </div>
              <button type="submit" disabled={saving} className="w-full rounded-lg border border-[#c4f36b] px-4 py-2.5 text-sm font-semibold hover:bg-[#f1f1f1] dark:hover:bg-[#344126] disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Salvando..." : "Salvar evento"}</button>
            </form>
            </details>
          )}
        </div>
      )}
      {readOnly && <p className="self-center text-sm text-[#748078] dark:text-[#a7b2a9]">Perfil somente leitura: registro desabilitado.</p>}
    </section>
  );
}

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Driver } from "../drivers/types";
import type { Vehicle } from "../vehicles/types";
import { RecordPagination, useRecordPagination } from "./RecordPagination";
import { createFuelRecord, listFuelRecords, type FuelRecord } from "./api";
import {
  fuelDeviationThresholdPercent,
  getFuelDeviation,
  summarizeFuelByVehicle,
  type VehicleFuelSummary,
} from "./analytics";

type Props = {
  vehicles: Vehicle[];
  drivers: Pick<Driver, "id" | "fullName" | "status">[];
  readOnly: boolean;
  refreshKey: number;
  onChanged: () => void;
};

function localDateValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function formatLiters(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value / 1000);
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatKmpl(value: number | null) {
  return value === null ? "—" : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km/L`;
}

function FuelSummary({ summaries }: { summaries: VehicleFuelSummary[] }) {
  const deviations = summaries.reduce((sum, item) => sum + item.deviationCount, 0);
  return (
    <div className="lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">Consumo médio por veículo</h4>
          <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
            Cada abastecimento é comparado à média histórica do próprio veículo. Variação de {fuelDeviationThresholdPercent}% ou mais acima do consumo esperado é sinalizada como desvio.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            deviations > 0
              ? "bg-[#fdecea] text-[#b3261e] dark:bg-[#3a1f1c] dark:text-[#ffb4ab]"
              : "bg-[#ebebeb] text-[#4f6f2c] dark:bg-fleet-highlight dark:text-[#c4f36b]"
          }`}
        >
          {deviations > 0 ? `${deviations} desvio(s) identificado(s)` : "Nenhum desvio identificado"}
        </span>
      </div>
      <div className="mt-3 max-h-80 overflow-auto rounded-xl border border-[#e8ece6] dark:border-fleet-border" tabIndex={0} aria-label="Tabela de consumo por veículo">
        <table className="w-full min-w-[34rem] text-left text-xs">
          <thead className="bg-[#f7f7f7] text-[#748078] dark:bg-[#20271f] dark:text-[#a7b2a9]">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Veículo</th>
              <th scope="col" className="px-3 py-2 font-medium">Média</th>
              <th scope="col" className="px-3 py-2 font-medium">Último</th>
              <th scope="col" className="px-3 py-2 font-medium">Custo por km</th>
              <th scope="col" className="px-3 py-2 font-medium">Total abastecido</th>
              <th scope="col" className="px-3 py-2 font-medium">Desvios</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((item) => (
              <tr key={item.vehicleId} className="border-t border-[#e8ece6] dark:border-fleet-border">
                <th scope="row" className="px-3 py-2 font-medium">{item.vehiclePlate}</th>
                <td className="px-3 py-2">{formatKmpl(item.averageKmpl)}</td>
                <td className="px-3 py-2">{formatKmpl(item.lastKmpl)}</td>
                <td className="px-3 py-2">{item.costPerKmCents === null ? "—" : currency.format(item.costPerKmCents / 100)}</td>
                <td className="px-3 py-2">{item.totalLiters.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} L · {currency.format(item.totalCostCents / 100)}</td>
                <td className={`px-3 py-2 font-semibold ${item.deviationCount > 0 ? "text-[#b3261e] dark:text-[#ffb4ab]" : ""}`}>{item.deviationCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FuelRecordRow({ record }: { record: FuelRecord }) {
  const deviation = getFuelDeviation(record);
  const variation = deviation?.variationPercent ?? null;

  return (
    <li className="flex flex-col gap-2 border-t border-[#e8ece6] py-3 text-sm dark:border-fleet-border sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">{record.vehiclePlate} · {formatLiters(record.litersMilliliters)} L</p>
        <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
          {new Date(`${record.occurredAt}T00:00:00`).toLocaleDateString("pt-BR")} · {record.driverName}{record.station && ` · ${record.station}`}
        </p>
        <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
          {record.odometerKm.toLocaleString("pt-BR")} km · {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(record.amountCents / 100)} · Rota: {record.route}
        </p>
      </div>
      <div className="text-sm sm:text-right">
        <p className="font-medium">
          {record.consumptionKmpl === null
            ? "Histórico insuficiente"
            : `${record.consumptionKmpl.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km/L`}
        </p>
        {variation !== null && (
          <p className="text-xs text-[#748078] dark:text-[#a7b2a9]">
            Média anterior: {record.historicalAverageKmpl?.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km/L · {variation > 0 ? "+" : ""}{variation.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% vs. média
          </p>
        )}
        {deviation?.level === "worse" && (
          <span className="mt-1 inline-block rounded-full bg-[#fdecea] px-2.5 py-0.5 text-xs font-semibold text-[#b3261e] dark:bg-[#3a1f1c] dark:text-[#ffb4ab]">
            Desvio: consumo acima do esperado
          </span>
        )}
        {deviation?.level === "better" && (
          <span className="mt-1 inline-block rounded-full bg-[#ebebeb] px-2.5 py-0.5 text-xs font-semibold text-[#4f6f2c] dark:bg-fleet-highlight dark:text-[#c4f36b]">
            Consumo melhor que a média
          </span>
        )}
      </div>
    </li>
  );
}

export function FuelRecordsPanel({ vehicles, drivers, readOnly, refreshKey, onChanged }: Props) {
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [filterVehicleId, setFilterVehicleId] = useState("all");
  const [vehicleId, setVehicleId] = useState(String(vehicles[0]?.id ?? ""));
  const [driverId, setDriverId] = useState(String(drivers.find((driver) => driver.status === "active")?.id ?? ""));
  const [liters, setLiters] = useState("");
  const [amount, setAmount] = useState("");
  const [occurredAt, setOccurredAt] = useState(localDateValue);
  const [odometerKm, setOdometerKm] = useState("");
  const [station, setStation] = useState("");
  const [route, setRoute] = useState("");
  const visibleRecords = useMemo(
    () => filterVehicleId === "all"
      ? records
      : records.filter((record) => record.vehicleId === Number(filterVehicleId)),
    [records, filterVehicleId],
  );
  const fuelSummaries = useMemo(() => summarizeFuelByVehicle(visibleRecords), [visibleRecords]);
  const pagination = useRecordPagination(visibleRecords);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await listFuelRecords();
        if (active) setRecords(result);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar os abastecimentos.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [refreshKey, refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const litersValue = Number(liters);
    const amountValue = Number(amount);
    const odometerValue = Number(odometerKm);
    if (
      !Number.isFinite(litersValue) || litersValue <= 0 ||
      !Number.isFinite(amountValue) || amountValue <= 0 ||
      !Number.isSafeInteger(odometerValue) || odometerValue < 0
    ) {
      setError("Informe litros, valor e quilometragem válidos.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createFuelRecord({
        vehicleId: Number(vehicleId),
        driverId: Number(driverId),
        litersMilliliters: Math.round(litersValue * 1000),
        amountCents: Math.round(amountValue * 100),
        occurredAt,
        odometerKm: odometerValue,
        station: station.trim() || null,
        route: route.trim(),
      });
      setLiters("");
      setAmount("");
      setOdometerKm("");
      setStation("");
      setRoute("");
      setRefresh((current) => current + 1);
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível registrar o abastecimento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid grid-cols-1 gap-5 rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-fleet-border dark:bg-fleet-raised lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
      {!loading && fuelSummaries.length > 0 && (
        <details className="min-w-0 rounded-xl bg-[#f7f7f7] p-4 dark:bg-[#20271f] lg:col-span-2">
          <summary className="cursor-pointer text-sm font-semibold">Ver análise de consumo por veículo</summary>
          <div className="mt-4"><FuelSummary summaries={fuelSummaries} /></div>
        </details>
      )}
      <div>
        <h3 className="text-lg font-semibold">Abastecimentos e consumo</h3>
        <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
          Estimativa: distância entre registros consecutivos dividida pelos litros atuais. Abastecimentos parciais podem distorcer o resultado.
        </p>
        <label className="mt-3 block max-w-xs text-xs font-medium">
          Filtrar por veículo
          <select
            value={filterVehicleId}
            onChange={(event) => {
              setFilterVehicleId(event.target.value);
              pagination.setPage(1);
            }}
            className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base"
          >
            <option value="all">Todos os veículos</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.plate} · {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>
        </label>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        {loading ? (
          <p role="status" className="py-5 text-sm text-[#748078] dark:text-[#a7b2a9]">Carregando abastecimentos...</p>
        ) : error && records.length === 0 ? null : visibleRecords.length === 0 ? (
          records.length === 0 ? (
          <p className="py-5 text-sm text-[#748078] dark:text-[#a7b2a9]">Nenhum abastecimento registrado.</p>
          ) : (
            <p className="py-5 text-sm text-[#748078] dark:text-[#a7b2a9]">Nenhum abastecimento para este veículo.</p>
          )
        ) : (
          <>
            <ul className="mt-3">
              {pagination.items.map((record) => <FuelRecordRow key={record.id} record={record} />)}
            </ul>
            <RecordPagination label="abastecimentos" page={pagination.page} totalPages={pagination.totalPages} onPageChange={pagination.setPage} />
          </>
        )}
      </div>
      {!readOnly && drivers.length > 0 && (
        <form onSubmit={submit} className="space-y-3 rounded-xl bg-[#f7f7f7] p-4 dark:bg-[#20271f]">
          <h4 className="text-sm font-semibold">Registrar abastecimento</h4>
          <label className="block text-xs font-medium">
            Veículo
            <select required value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base">
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} · {vehicle.make} {vehicle.model}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium">
            Motorista
            <select required value={driverId} onChange={(event) => setDriverId(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base">
              {drivers.filter((driver) => driver.status === "active").map((driver) => <option key={driver.id} value={driver.id}>{driver.fullName}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium">Litros<input required min="0.001" step="0.001" type="number" value={liters} onChange={(event) => setLiters(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
            <label className="block text-xs font-medium">Valor (R$)<input required min="0.01" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
          </div>
          <label className="block text-xs font-medium">Data<input required type="date" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
          <label className="block text-xs font-medium">Quilometragem (km)<input required min="0" step="1" type="number" value={odometerKm} onChange={(event) => setOdometerKm(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
          <label className="block text-xs font-medium">Posto (opcional)<input maxLength={200} value={station} onChange={(event) => setStation(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
          <label className="block text-xs font-medium">Rota<input required maxLength={240} value={route} onChange={(event) => setRoute(event.target.value)} className="mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-sm dark:border-fleet-border dark:bg-fleet-base" /></label>
          <button type="submit" disabled={saving || drivers.every((driver) => driver.status !== "active")} className="w-full rounded-lg bg-[#c4f36b] px-4 py-2.5 text-sm font-semibold text-[#1d2819] disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? "Salvando..." : "Salvar abastecimento"}
          </button>
          {drivers.every((driver) => driver.status !== "active") && <p className="text-xs text-[#748078] dark:text-[#a7b2a9]">Cadastre um motorista ativo para continuar.</p>}
        </form>
      )}
      {!readOnly && drivers.length === 0 && (
        <p className="self-center text-sm text-[#748078] dark:text-[#a7b2a9]">
          Cadastre um motorista antes de registrar abastecimentos.
        </p>
      )}
      {readOnly && <p className="self-center text-sm text-[#748078] dark:text-[#a7b2a9]">Perfil somente leitura: registro desabilitado.</p>}
    </section>
  );
}

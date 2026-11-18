import { useCallback, useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { NativeSelect } from "../components/ui/native-select";
import { useCurrentUser } from "../features/auth/useCurrentUser";
import { listDrivers } from "../features/drivers/api";
import type { Driver } from "../features/drivers/types";
import {
  getPreventiveMaintenance,
  saveOdometerReading,
  savePreventivePlan,
  saveVehicleService,
  type PreventiveMaintenanceData,
  type PreventiveServiceType,
} from "../features/maintenance/api";
import { FleetAppShell } from "../features/navigation/FleetAppShell";
import { FleetRecords, type MaintenanceTab } from "../features/fleet-records/FleetRecords";

const serviceLabels: Record<PreventiveServiceType, string> = {
  oil_change: "Troca de óleo",
  brake_pads: "Pastilhas de freio",
  washing: "Lavagem",
  other: "Outro serviço",
};

function localDateValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function formatKm(value: number | null) {
  return value === null ? "—" : `${value.toLocaleString("pt-BR")} km`;
}

const fieldClass =
  "mt-1 w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2.5 text-sm text-[#17221c] dark:border-fleet-border dark:bg-fleet-base dark:text-[#eff4ef]";

const tabs: { id: MaintenanceTab; label: string; description: string }[] = [
  { id: "preventive", label: "Preventiva", description: "Quilometragem e lembretes" },
  { id: "fuel", label: "Abastecimentos", description: "Consumo e histórico" },
  { id: "maintenance", label: "Ocorrências", description: "Serviços e prazos" },
  { id: "tires", label: "Pneus", description: "Desgaste e histórico" },
];

export function MaintenancePage() {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<MaintenanceTab>("preventive");
  const [data, setData] = useState<PreventiveMaintenanceData | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [readingVehicleId, setReadingVehicleId] = useState("");
  const [readingDriverId, setReadingDriverId] = useState("");
  const [readingOdometerKm, setReadingOdometerKm] = useState("");
  const [readingDate, setReadingDate] = useState(localDateValue);

  const [planVehicleId, setPlanVehicleId] = useState("");
  const [planType, setPlanType] = useState<"oil_change" | "brake_pads">("oil_change");
  const [planIntervalKm, setPlanIntervalKm] = useState("");
  const [planLastServiceKm, setPlanLastServiceKm] = useState("");

  const [serviceVehicleId, setServiceVehicleId] = useState("");
  const [serviceDriverId, setServiceDriverId] = useState("");
  const [serviceType, setServiceType] = useState<PreventiveServiceType>("washing");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceOdometerKm, setServiceOdometerKm] = useState("");
  const [serviceDate, setServiceDate] = useState(localDateValue);

  const refresh = useCallback(() => setRefreshKey((current) => current + 1), []);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [maintenance, driverResult] = await Promise.all([
          getPreventiveMaintenance(),
          listDrivers(1, 100, "", "active"),
        ]);
        if (!active) return;
        setData(maintenance);
        setDrivers(driverResult.items);
        setReadingVehicleId((current) => current || String(maintenance.vehicles[0]?.id ?? ""));
        setPlanVehicleId((current) => current || String(maintenance.vehicles[0]?.id ?? ""));
        setServiceVehicleId((current) => current || String(maintenance.vehicles[0]?.id ?? ""));
        setReadingDriverId((current) => current || String(driverResult.items[0]?.id ?? ""));
        setReadingOdometerKm((current) =>
          current || String(maintenance.vehicles[0]?.currentOdometerKm ?? ""),
        );
        setServiceOdometerKm((current) =>
          current || String(maintenance.vehicles[0]?.currentOdometerKm ?? ""),
        );
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Não foi possível carregar a manutenção.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const selectedPlanVehicle = data?.vehicles.find(
    (vehicle) => vehicle.id === Number(planVehicleId),
  );
  const existingPlan = data?.plans.find(
    (plan) =>
      plan.vehicleId === Number(planVehicleId) &&
      plan.serviceType === planType,
  );

  useEffect(() => {
    setPlanIntervalKm(existingPlan ? String(existingPlan.intervalKm) : "");
    setPlanLastServiceKm(
      existingPlan
        ? String(existingPlan.lastServiceOdometerKm)
        : String(selectedPlanVehicle?.currentOdometerKm ?? ""),
    );
  }, [existingPlan, selectedPlanVehicle]);

  const duePlans = useMemo(() => {
    if (!data) return [];
    return data.plans.map((plan) => {
      const vehicle = data.vehicles.find((item) => item.id === plan.vehicleId);
      const nextDueKm = plan.lastServiceOdometerKm + plan.intervalKm;
      const currentKm = vehicle?.currentOdometerKm ?? null;
      return {
        ...plan,
        nextDueKm,
        currentKm,
        remainingKm: currentKm === null ? null : nextDueKm - currentKm,
      };
    });
  }, [data]);

  const lateCount = duePlans.filter((plan) => plan.remainingKm !== null && plan.remainingKm <= 0).length;

  function handleTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex = event.key === "ArrowRight" ? (currentIndex + 1) % buttons.length
      : event.key === "ArrowLeft" ? (currentIndex - 1 + buttons.length) % buttons.length
        : event.key === "Home" ? 0
          : event.key === "End" ? buttons.length - 1
            : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    buttons[nextIndex]?.focus();
    buttons[nextIndex]?.click();
  }

  async function submitReading(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving("reading");
    setError(null);
    setNotice(null);
    try {
      const result = await saveOdometerReading({
        vehicleId: Number(readingVehicleId),
        driverId: Number(readingDriverId),
        occurredAt: readingDate,
        odometerKm: Number(readingOdometerKm),
      });
      setNotice(
        result.distanceKm === null
          ? "Leitura inicial registrada. A próxima leitura calculará a distância percorrida."
          : `Quilometragem registrada: ${formatKm(result.distanceKm)} percorridos desde a leitura anterior.`,
      );
      setReadingOdometerKm("");
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível registrar a quilometragem.");
    } finally {
      setSaving(null);
    }
  }

  async function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving("plan");
    setError(null);
    setNotice(null);
    try {
      await savePreventivePlan({
        vehicleId: Number(planVehicleId),
        serviceType: planType,
        intervalKm: Number(planIntervalKm),
        lastServiceOdometerKm: Number(planLastServiceKm),
      });
      setNotice(`Lembrete de ${serviceLabels[planType].toLocaleLowerCase("pt-BR")} salvo.`);
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar o lembrete.");
    } finally {
      setSaving(null);
    }
  }

  async function submitService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving("service");
    setError(null);
    setNotice(null);
    try {
      await saveVehicleService({
        vehicleId: Number(serviceVehicleId),
        driverId: serviceDriverId ? Number(serviceDriverId) : null,
        serviceType,
        description: serviceDescription.trim() || null,
        occurredAt: serviceDate,
        odometerKm: Number(serviceOdometerKm),
      });
      setNotice(`${serviceLabels[serviceType]} registrada.`);
      setServiceDescription("");
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível registrar o serviço.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <FleetAppShell active="maintenance" title="Manutenção">
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#779b4d] dark:text-[#c4f36b]">
          CUIDADO COM A FROTA
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Manutenção e registros da frota
            </h1>
            <p className="mt-2 text-sm text-[#748078] dark:text-[#a7b2a9]">
              Acompanhe a manutenção preventiva, abastecimentos, ocorrências e pneus em um só lugar.
            </p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Áreas de manutenção e registros"
          onKeyDown={handleTabKeyDown}
          className="mt-7 grid grid-cols-2 gap-2 rounded-2xl border border-[#e5eae2] bg-white p-2 dark:border-fleet-border dark:bg-fleet-raised lg:grid-cols-4"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`fleet-records-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`fleet-records-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-3 text-left transition focus-visible:outline-2 focus-visible:outline-[#84ad45] ${
                activeTab === tab.id
                  ? "bg-[#eeeeee] text-[#456327] dark:bg-fleet-highlight dark:text-[#c4f36b]"
                  : "text-[#526056] hover:bg-[#f7f7f7] dark:text-[#d9e1da] dark:hover:bg-fleet-surface"
              }`}
            >
              <span className="block text-sm font-semibold">{tab.label}</span>
              <span className="mt-1 block text-xs text-[#748078] dark:text-[#a7b2a9]">{tab.description}</span>
            </button>
          ))}
        </div>

        <div id="fleet-records-panel-preventive" role="tabpanel" aria-labelledby="fleet-records-tab-preventive" tabIndex={0} hidden={activeTab !== "preventive"}>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Manutenção preventiva</h2>
            <p className="mt-1 text-sm text-[#748078] dark:text-[#a7b2a9]">Registre quilometragem, acompanhe trocas e anote lavagens.</p>
          </div>
          <Button type="button" variant="outline" onClick={refresh} disabled={loading}>Atualizar</Button>
        </div>
        {error && (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-5 rounded-xl bg-[#eeeeee] px-4 py-3 text-sm text-[#526f37] dark:bg-fleet-highlight dark:text-[#c4f36b]">
            {notice}
          </p>
        )}

        {loading ? (
          <p role="status" className="mt-8 text-sm text-[#748078] dark:text-[#a7b2a9]">
            Carregando manutenção...
          </p>
        ) : !data ? null : (
          <>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#e5eae2] bg-white p-4 dark:border-fleet-border dark:bg-fleet-raised">
                <p className="text-xs text-[#748078] dark:text-[#a7b2a9]">Veículos acompanhados</p>
                <p className="mt-1 text-2xl font-semibold">{data.vehicles.length}</p>
              </div>
              <div className={`rounded-2xl border p-4 ${lateCount > 0 ? "border-[#ecd9a8] bg-[#fdf8ea] dark:border-[#574a22] dark:bg-[#2d2616]" : "border-[#e5eae2] bg-white dark:border-fleet-border dark:bg-fleet-raised"}`}>
                <p className="text-xs text-[#748078] dark:text-[#a7b2a9]">Manutenções vencidas</p>
                <p className="mt-1 text-2xl font-semibold">{lateCount}</p>
              </div>
              <div className="rounded-2xl border border-[#e5eae2] bg-white p-4 dark:border-fleet-border dark:bg-fleet-raised">
                <p className="text-xs text-[#748078] dark:text-[#a7b2a9]">Lembretes configurados</p>
                <p className="mt-1 text-2xl font-semibold">{data.plans.length}</p>
              </div>
            </div>

            <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
              <section className="rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-fleet-border dark:bg-fleet-raised">
                <h2 className="text-lg font-semibold">Próximas manutenções</h2>
                <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
                  O alerta aparece quando o veículo alcança a quilometragem prevista.
                </p>
                {duePlans.length === 0 ? (
                  <p className="mt-5 rounded-xl bg-[#f7f7f7] p-4 text-sm text-[#748078] dark:bg-fleet-surface dark:text-[#a7b2a9]">
                    Nenhum lembrete cadastrado. Defina um intervalo para troca de óleo ou pastilhas de freio.
                  </p>
                ) : (
                  <ul className="mt-4 max-h-80 overflow-y-auto divide-y divide-[#edf0eb] dark:divide-fleet-border" tabIndex={0} aria-label="Lembretes de manutenção">
                    {duePlans.map((plan) => {
                      const overdue = plan.remainingKm !== null && plan.remainingKm <= 0;
                      return (
                        <li key={plan.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                          <div>
                            <p className="font-medium">{plan.vehiclePlate} · {serviceLabels[plan.serviceType]}</p>
                            <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
                              Atual: {formatKm(plan.currentKm)} · Próxima: {formatKm(plan.nextDueKm)}
                            </p>
                          </div>
                          {plan.remainingKm === null ? (
                            <span className="text-xs text-[#748078] dark:text-[#a7b2a9]">Registre a quilometragem</span>
                          ) : overdue ? (
                            <span className="rounded-full bg-[#fdf0ed] px-3 py-1 text-xs font-semibold text-[#9b3d30] dark:bg-[#3a211f] dark:text-[#ffb4ab]">
                              Vencida há {formatKm(Math.abs(plan.remainingKm))}
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#eeeeee] px-3 py-1 text-xs font-medium text-[#526f37] dark:bg-fleet-highlight dark:text-[#c4f36b]">
                              Faltam {formatKm(plan.remainingKm)}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <div className="space-y-4">
                <section className="rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-fleet-border dark:bg-fleet-raised">
                  <h2 className="text-lg font-semibold">Registrar quilometragem</h2>
                  <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">
                    A distância do motorista é calculada pela diferença entre as leituras.
                  </p>
                  {user?.readOnly ? (
                    <p className="mt-4 text-sm text-[#748078] dark:text-[#a7b2a9]">Perfil somente leitura.</p>
                  ) : data.vehicles.length === 0 || drivers.length === 0 ? (
                    <p className="mt-4 text-sm text-[#748078] dark:text-[#a7b2a9]">
                      Cadastre um veículo e um motorista ativo para registrar a quilometragem.
                    </p>
                  ) : (
                    <form onSubmit={submitReading} className="mt-4 space-y-3">
                      <label className="block text-xs font-medium">
                        Veículo
                        <NativeSelect
                          required
                          value={readingVehicleId}
                          onChange={(event) => {
                            const id = event.target.value;
                            setReadingVehicleId(id);
                            setReadingOdometerKm(
                              String(data.vehicles.find((vehicle) => vehicle.id === Number(id))?.currentOdometerKm ?? ""),
                            );
                          }}
                          className={fieldClass}
                        >
                          {data.vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.plate} · {vehicle.make} {vehicle.model} ({formatKm(vehicle.currentOdometerKm)})
                            </option>
                          ))}
                        </NativeSelect>
                      </label>
                      <label className="block text-xs font-medium">
                        Motorista
                        <NativeSelect
                          required
                          value={readingDriverId}
                          onChange={(event) => setReadingDriverId(event.target.value)}
                          className={fieldClass}
                        >
                          {drivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>{driver.fullName}</option>
                          ))}
                        </NativeSelect>
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-xs font-medium">
                          Quilometragem atual
                          <Input
                            required
                            type="number"
                            min={0}
                            step={1}
                            value={readingOdometerKm}
                            onChange={(event) => setReadingOdometerKm(event.target.value)}
                            className={fieldClass}
                          />
                        </label>
                        <label className="block text-xs font-medium">
                          Data
                          <Input
                            required
                            type="date"
                            value={readingDate}
                            onChange={(event) => setReadingDate(event.target.value)}
                            className={fieldClass}
                          />
                        </label>
                      </div>
                      <Button type="submit" disabled={saving !== null}>
                        {saving === "reading" ? "Salvando..." : "Registrar km"}
                      </Button>
                    </form>
                  )}
                </section>

                <details className="rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-fleet-border dark:bg-fleet-raised">
                  <summary className="cursor-pointer text-sm font-semibold">Configurar lembrete por km</summary>
                  <p className="mt-2 text-xs text-[#748078] dark:text-[#a7b2a9]">
                    Informe o intervalo definido para cada veículo. O sistema não presume quilometragens de fábrica.
                  </p>
                  {user?.readOnly ? (
                    <p className="mt-3 text-sm text-[#748078] dark:text-[#a7b2a9]">Perfil somente leitura.</p>
                  ) : (
                    <form onSubmit={submitPlan} className="mt-4 space-y-3">
                      <label className="block text-xs font-medium">
                        Veículo
                        <NativeSelect
                          required
                          value={planVehicleId}
                          onChange={(event) => setPlanVehicleId(event.target.value)}
                          className={fieldClass}
                        >
                          {data.vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>{vehicle.plate}</option>
                          ))}
                        </NativeSelect>
                      </label>
                      <label className="block text-xs font-medium">
                        Item
                        <NativeSelect
                          value={planType}
                          onChange={(event) => setPlanType(event.target.value as typeof planType)}
                          className={fieldClass}
                        >
                          <option value="oil_change">Troca de óleo</option>
                          <option value="brake_pads">Pastilhas de freio</option>
                        </NativeSelect>
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-xs font-medium">
                          Intervalo (km)
                          <Input
                            required
                            type="number"
                            min={1}
                            max={1_000_000}
                            value={planIntervalKm}
                            onChange={(event) => setPlanIntervalKm(event.target.value)}
                            className={fieldClass}
                          />
                        </label>
                        <label className="block text-xs font-medium">
                          Último serviço (km)
                          <Input
                            required
                            type="number"
                            min={0}
                            max={selectedPlanVehicle?.currentOdometerKm ?? undefined}
                            value={planLastServiceKm}
                            onChange={(event) => setPlanLastServiceKm(event.target.value)}
                            className={fieldClass}
                          />
                        </label>
                      </div>
                      <Button
                        type="submit"
                        disabled={
                          saving !== null ||
                          data.vehicles.length === 0 ||
                          selectedPlanVehicle?.currentOdometerKm === null ||
                          selectedPlanVehicle === undefined
                        }
                      >
                        {saving === "plan" ? "Salvando..." : existingPlan ? "Atualizar lembrete" : "Salvar lembrete"}
                      </Button>
                    </form>
                  )}
                </details>

                <details className="rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-fleet-border dark:bg-fleet-raised">
                  <summary className="cursor-pointer text-sm font-semibold">Registrar serviço ou lavagem</summary>
                  {user?.readOnly ? (
                    <p className="mt-3 text-sm text-[#748078] dark:text-[#a7b2a9]">Perfil somente leitura.</p>
                  ) : (
                    <form onSubmit={submitService} className="mt-4 space-y-3">
                      <label className="block text-xs font-medium">
                        Veículo
                        <NativeSelect
                          required
                          value={serviceVehicleId}
                          onChange={(event) => {
                            const id = event.target.value;
                            setServiceVehicleId(id);
                            setServiceOdometerKm(
                              String(data.vehicles.find((vehicle) => vehicle.id === Number(id))?.currentOdometerKm ?? ""),
                            );
                          }}
                          className={fieldClass}
                        >
                          {data.vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.plate} · {formatKm(vehicle.currentOdometerKm)}
                            </option>
                          ))}
                        </NativeSelect>
                      </label>
                      <label className="block text-xs font-medium">
                        Serviço
                        <NativeSelect
                          value={serviceType}
                          onChange={(event) => setServiceType(event.target.value as PreventiveServiceType)}
                          className={fieldClass}
                        >
                          {Object.entries(serviceLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </NativeSelect>
                      </label>
                      <label className="block text-xs font-medium">
                        Motorista (opcional)
                        <NativeSelect
                          value={serviceDriverId}
                          onChange={(event) => setServiceDriverId(event.target.value)}
                          className={fieldClass}
                        >
                          <option value="">Não informado</option>
                          {drivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>{driver.fullName}</option>
                          ))}
                        </NativeSelect>
                      </label>
                      {serviceType === "other" && (
                        <label className="block text-xs font-medium">
                          Descrição
                          <Input
                            required
                            maxLength={1000}
                            value={serviceDescription}
                            onChange={(event) => setServiceDescription(event.target.value)}
                            className={fieldClass}
                          />
                        </label>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-xs font-medium">
                          Quilometragem
                          <Input
                            required
                            type="number"
                            min={0}
                            value={serviceOdometerKm}
                            onChange={(event) => setServiceOdometerKm(event.target.value)}
                            className={fieldClass}
                          />
                        </label>
                        <label className="block text-xs font-medium">
                          Data
                          <Input
                            required
                            type="date"
                            value={serviceDate}
                            onChange={(event) => setServiceDate(event.target.value)}
                            className={fieldClass}
                          />
                        </label>
                      </div>
                      <Button type="submit" disabled={saving !== null || data.vehicles.length === 0}>
                        {saving === "service" ? "Salvando..." : "Registrar serviço"}
                      </Button>
                    </form>
                  )}
                </details>
              </div>
            </div>

            <section className="mt-5 rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-fleet-border dark:bg-fleet-raised">
              <h2 className="text-lg font-semibold">Atividade recente</h2>
              {data.readings.length === 0 && data.services.length === 0 ? (
                <p className="mt-3 text-sm text-[#748078] dark:text-[#a7b2a9]">
                  Leituras de km e serviços registrados aparecerão aqui.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-[#edf0eb] dark:divide-fleet-border">
                  {[
                    ...data.services.map((service) => ({
                      id: `service-${service.id}`,
                      date: service.occurredAt,
                      title: `${service.vehiclePlate} · ${serviceLabels[service.serviceType]}`,
                      detail: `${formatKm(service.odometerKm)}${service.driverName ? ` · ${service.driverName}` : ""}${service.description ? ` · ${service.description}` : ""}`,
                    })),
                    ...data.readings.map((reading) => ({
                      id: `reading-${reading.id}`,
                      date: reading.occurredAt,
                      title: `${reading.vehiclePlate} · ${reading.driverName}`,
                      detail: `${formatKm(reading.odometerKm)}${reading.distanceKm === null ? " · leitura inicial" : ` · percorreu ${formatKm(reading.distanceKm)}`}`,
                    })),
                  ]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 8)
                    .map((item) => (
                      <li key={item.id} className="flex flex-wrap justify-between gap-2 py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="mt-1 text-xs text-[#748078] dark:text-[#a7b2a9]">{item.detail}</p>
                        </div>
                        <time className="text-xs text-[#748078] dark:text-[#a7b2a9]">
                          {new Date(`${item.date}T00:00:00`).toLocaleDateString("pt-BR")}
                        </time>
                      </li>
                    ))}
                </ul>
              )}
            </section>
          </>
        )}
        </div>
        {user && <FleetRecords readOnly={user.readOnly} onChanged={refresh} activeTab={activeTab} />}
      </section>
    </FleetAppShell>
  );
}

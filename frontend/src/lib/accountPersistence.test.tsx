// @vitest-environment jsdom
import { StrictMode, act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountProvider, useAccount } from './AccountContext';
import type { Conta } from './AccountContext';
import { DriverProvider, useDrivers } from './DriverContext';
import { VehicleProvider, useVehicles } from './VehicleContext';
import type { Vehicle } from './VehicleContext';
import { canAccessRoute } from './modules';
import { DEMO_ACCOUNT_ID } from './constants';

type Snapshot = ReturnType<typeof useAccount> & ReturnType<typeof useDrivers> & ReturnType<typeof useVehicles>;
let snapshot: Snapshot;
let root: Root;

const account: Conta = {
  id: 1, nome_cliente: 'Conta A', documento: '1', email_contato: 'a@example.com', status: 'ativo',
};
const vehicle: Vehicle = {
  id: 1, plate: 'ABC-1234', model: 'Caminhão A', year: 2024,
  city: 'São Paulo', uf: 'SP', status: 'active', monthlyRevenue: 100,
};
const driver = {
  id: 1, name: 'Condutor A', cnh: '123', category: 'D', phone: '', status: 'active', score: 100, tier: 'Gold',
};

function Probe() {
  const accounts = useAccount();
  const drivers = useDrivers();
  const vehicles = useVehicles();
  useEffect(() => { snapshot = { ...accounts, ...drivers, ...vehicles }; });
  return null;
}

async function mount() {
  await act(async () => {
    root.render(<StrictMode><AccountProvider><DriverProvider><VehicleProvider><Probe /></VehicleProvider></DriverProvider></AccountProvider></StrictMode>);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  // Node 26 exposes its own Web Storage; use the browser storage provided by jsdom.
  const browserWindow = (globalThis as typeof globalThis & { jsdom: { window: Window & typeof globalThis } }).jsdom.window;
  vi.stubGlobal('localStorage', browserWindow.localStorage);
  vi.stubGlobal('Storage', browserWindow.Storage);
  localStorage.clear();
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });
  root = createRoot(document.createElement('div'));
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('persistência por conta', () => {
  it('troca contas sem copiar veículos ou motoristas, inclusive no StrictMode', async () => {
    localStorage.setItem('ecoFleet_contas', JSON.stringify([account, { ...account, id: 2 }]));
    localStorage.setItem('fleet_active_account', '1');
    localStorage.setItem('ecoFleet_vehicles_1', JSON.stringify([vehicle]));
    localStorage.setItem('ecoFleet_drivers_1', JSON.stringify([driver]));
    await mount();
    expect(snapshot.vehicles).toEqual([vehicle]);
    expect(snapshot.drivers).toEqual([driver]);
    await act(async () => snapshot.setActiveAccountId(2));
    expect(snapshot.vehicles).toEqual([]);
    expect(snapshot.drivers).toEqual([]);
    expect(JSON.parse(localStorage.getItem('ecoFleet_vehicles_2')!)).toEqual([]);
    expect(JSON.parse(localStorage.getItem('ecoFleet_drivers_2')!)).toEqual([]);
    await act(async () => snapshot.setActiveAccountId(1));
    expect(snapshot.vehicles).toEqual([vehicle]);
    expect(snapshot.drivers).toEqual([driver]);
  });

  it('preserva a demo e persiste a exclusão de todos os dados após remontar', async () => {
    await mount();
    expect(snapshot.activeAccountId).toBe(DEMO_ACCOUNT_ID);
    expect(snapshot.vehicles.length).toBeGreaterThan(0);
    expect(snapshot.drivers.length).toBeGreaterThan(0);
    await act(async () => { snapshot.clearVehicles(); snapshot.clearDrivers(); });
    await act(async () => root.unmount());
    root = createRoot(document.createElement('div'));
    await mount();
    expect(snapshot.vehicles).toEqual([]);
    expect(snapshot.drivers).toEqual([]);
  });

  it('não altera valores financeiros de contas reais com o relógio da demo', async () => {
    localStorage.setItem('ecoFleet_contas', JSON.stringify([account]));
    localStorage.setItem('fleet_active_account', '1');
    localStorage.setItem('ecoFleet_vehicles_1', JSON.stringify([vehicle]));
    await mount();
    await act(async () => vi.advanceTimersByTime(15000));
    expect(snapshot.vehicles).toEqual([vehicle]);
    await act(async () => snapshot.setActiveAccountId(DEMO_ACCOUNT_ID));
    const revenue = snapshot.vehicles[0].monthlyRevenue!;
    await act(async () => vi.advanceTimersByTime(5000));
    expect(snapshot.vehicles[0].monthlyRevenue).toBeGreaterThan(revenue);
  });

  it('recupera JSON inválido, estrutura inválida e conta ativa inexistente', async () => {
    localStorage.setItem('ecoFleet_contas', '{}');
    localStorage.setItem('fleet_active_account', '12345');
    localStorage.setItem(`ecoFleet_vehicles_${DEMO_ACCOUNT_ID}`, '{invalid');
    localStorage.setItem(`ecoFleet_drivers_${DEMO_ACCOUNT_ID}`, '[null]');
    await mount();
    expect(snapshot.activeAccountId).toBe(DEMO_ACCOUNT_ID);
    expect(snapshot.vehicles.length).toBeGreaterThan(0);
    expect(snapshot.drivers.length).toBeGreaterThan(0);
    expect(localStorage.getItem('ecoFleet_contas_recovery')).toBe('{}');
    expect(localStorage.getItem(`ecoFleet_vehicles_${DEMO_ACCOUNT_ID}_recovery`)).toBe('{invalid');
    expect(localStorage.getItem(`ecoFleet_drivers_${DEMO_ACCOUNT_ID}_recovery`)).toBe('[null]');
  });

  it('mantém a aplicação funcional quando o navegador bloqueia localStorage', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mount();
    await act(async () => snapshot.clearVehicles());
    expect(snapshot.vehicles).toEqual([]);
    expect(snapshot.activeAccountId).toBe(DEMO_ACCOUNT_ID);
  });

  it('ativa módulos sem reler valores antigos e sincroniza contas criadas em outra aba', async () => {
    localStorage.setItem('ecoFleet_contas', JSON.stringify([account]));
    localStorage.setItem('fleet_active_account', '1');
    await mount();
    expect(canAccessRoute(snapshot.activeAccount, '/finance')).toBe(false);
    await act(async () => snapshot.updateConta(1, { produto_financeiro: true }));
    expect(canAccessRoute(snapshot.activeAccount, '/finance')).toBe(true);
    expect(JSON.parse(localStorage.getItem('ecoFleet_contas')!)[0].produto_financeiro).toBe(true);
    const otherAccount = { ...account, id: 2 };
    localStorage.setItem('ecoFleet_contas', JSON.stringify([account, otherAccount]));
    await act(async () => window.dispatchEvent(new StorageEvent('storage', { key: 'ecoFleet_contas' })));
    expect(snapshot.contas.some(c => c.id === 2)).toBe(true);
  });
});

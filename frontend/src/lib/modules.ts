import type { Conta } from './AccountContext';
import { DEMO_ACCOUNT_ID } from './constants';

export const routeModules = {
  '/routing': 'produto_roteirizacao',
  '/maintenance': 'produto_manutencao',
  '/reports': 'produto_telemetria',
  '/finance': 'produto_financeiro',
} as const;

export function canAccessRoute(account: Conta | null, pathname: string): boolean {
  const module = routeModules[pathname as keyof typeof routeModules];
  return !module || (account !== null && (account.id === DEMO_ACCOUNT_ID || account[module] === true));
}

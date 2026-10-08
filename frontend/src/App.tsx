import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import { VehicleProvider } from './lib/VehicleContext';
import { DriverProvider } from './lib/DriverContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AccountProvider, useAccount } from './lib/AccountContext';
import { canAccessRoute } from './lib/modules';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const MainLayout = lazy(() => import('./layouts/MainLayout'));
const Login = lazy(() => import('./pages/Login'));
const Vehicles = lazy(() => import('./pages/Vehicles'));
const Drivers = lazy(() => import('./pages/Drivers'));
const Routing = lazy(() => import('./pages/Routing'));
const Reports = lazy(() => import('./pages/Reports'));
const Finance = lazy(() => import('./pages/Finance'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Landing = lazy(() => import('./pages/Landing'));
const CreateAccount = lazy(() => import('./pages/CreateAccount'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function FleetRoutes() {
  const { activeAccount } = useAccount();
  const { pathname } = useLocation();
  return (
    <DriverProvider>
      <VehicleProvider>
        {canAccessRoute(activeAccount, pathname) ? <MainLayout /> : <Navigate to="/marketplace" replace />}
      </VehicleProvider>
    </DriverProvider>
  );
}

function LoadingPage() {
  return <div role="status" className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-800 dark:bg-fleet-900 dark:text-white">Carregando…</div>;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AccountProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingPage />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                </Route>
                <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                  <Route element={<FleetRoutes />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/vehicles" element={<Vehicles />} />
                    <Route path="/drivers" element={<Drivers />} />
                    <Route path="/routing" element={<Routing />} />
                    <Route path="/maintenance" element={<Maintenance />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                  </Route>
                  <Route path="/nova-conta" element={<CreateAccount />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AccountProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

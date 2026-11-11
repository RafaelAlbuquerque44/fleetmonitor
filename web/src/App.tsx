import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { CurrentUserProvider, useCurrentUser } from "./features/auth/useCurrentUser";

const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })),
);
const DriversPage = lazy(() =>
  import("./pages/DriversPage").then((module) => ({ default: module.DriversPage })),
);
const FleetOverviewPage = lazy(() =>
  import("./pages/FleetOverviewPage").then((module) => ({
    default: module.FleetOverviewPage,
  })),
);
const LandingPage = lazy(() =>
  import("./pages/LandingPage").then((module) => ({ default: module.LandingPage })),
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({ default: module.LoginPage })),
);
const OperationsPage = lazy(() =>
  import("./pages/OperationsPage").then((module) => ({
    default: module.OperationsPage,
  })),
);

function AuthenticatedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, error } = useCurrentUser();

  if (isLoading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-[#f7f8f5] text-[#526056] dark:bg-fleet-canvas dark:text-[#d9e1da]"
        aria-busy="true"
      >
        <p role="status">Validando sua sessão...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f8f5] px-5 text-center text-[#526056] dark:bg-fleet-canvas dark:text-[#d9e1da]">
        <p role="alert">
          {error ?? "Sua sessão não está autenticada. Entre para acessar a plataforma."}
        </p>
        <a
          href="/login"
          className="rounded-full bg-[#17221c] px-5 py-2.5 text-sm font-semibold text-white dark:bg-[#c4f36b] dark:text-[#17221c]"
        >
          Ir para o login
        </a>
      </main>
    );
  }

  return children;
}

function protect(page: ReactNode) {
  return (
    <CurrentUserProvider>
      <AuthenticatedRoute>{page}</AuthenticatedRoute>
    </CurrentUserProvider>
  );
}

function AppRoutes() {
  const location = useLocation();
  const legacyMaintenanceRoute =
    location.pathname === "/app" &&
    new URLSearchParams(location.search).get("status") === "maintenance";

  return (
    <Suspense
      fallback={
        <main
          className="flex min-h-screen items-center justify-center bg-[#f7f8f5] text-[#526056] dark:bg-fleet-canvas dark:text-[#d9e1da]"
          role="status"
        >
          Carregando página...
        </main>
      }
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/app"
          element={protect(
            legacyMaintenanceRoute ? (
              <OperationsPage mode="maintenance" />
            ) : (
              <DashboardPage />
            ),
          )}
        />
        <Route path="/app/drivers" element={protect(<DriversPage />)} />
        <Route path="/app/overview" element={protect(<FleetOverviewPage />)} />
        <Route
          path="/app/maintenance"
          element={protect(<OperationsPage mode="maintenance" />)}
        />
        <Route path="/app/costs" element={protect(<OperationsPage mode="costs" />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

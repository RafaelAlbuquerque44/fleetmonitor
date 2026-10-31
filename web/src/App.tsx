import type { ReactNode } from "react";
import { DashboardPage } from "./pages/DashboardPage";
import { DriversPage } from "./pages/DriversPage";
import { FleetOverviewPage } from "./pages/FleetOverviewPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { CurrentUserProvider, useCurrentUser } from "./features/auth/useCurrentUser";

function AuthenticatedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, error } = useCurrentUser();

  if (isLoading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-[#f7f8f5] text-[#526056] dark:bg-[#101612] dark:text-[#d9e1da]"
        aria-busy="true"
      >
        <p role="status">Validando sua sessão...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f8f5] px-5 text-center text-[#526056] dark:bg-[#101612] dark:text-[#d9e1da]">
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

export default function App() {
  if (window.location.pathname === "/login") {
    return <LoginPage />;
  }
  if (window.location.pathname === "/app") {
    return protect(<DashboardPage />);
  }
  if (window.location.pathname === "/app/drivers") {
    return protect(<DriversPage />);
  }
  if (window.location.pathname === "/app/overview") {
    return protect(<FleetOverviewPage />);
  }
  return <LandingPage />;
}

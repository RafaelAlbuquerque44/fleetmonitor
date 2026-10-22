import { DashboardPage } from "./pages/DashboardPage";
import { FleetOverviewPage } from "./pages/FleetOverviewPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  if (window.location.pathname === "/login") {
    return <LoginPage />;
  }
  if (window.location.pathname === "/app") {
    return <DashboardPage />;
  }
  if (window.location.pathname === "/app/overview") {
    return <FleetOverviewPage />;
  }
  return <LandingPage />;
}

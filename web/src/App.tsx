import { useEffect, useState, type FormEvent, type ReactNode } from "react";

type IconName =
  | "arrow"
  | "check"
  | "eye"
  | "eyeOff"
  | "fleet"
  | "fuel"
  | "logout"
  | "maintenance"
  | "moon"
  | "plus"
  | "search"
  | "sun";

const icons: Record<IconName, ReactNode> = {
  arrow: <path d="M7 17 17 7M7 7h10v10" />,
  check: <path d="m5 12 4 4L19 6" />,
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a15 15 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10 10 0 0 0 4-.8" />
    </>
  ),
  fleet: (
    <>
      <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" />
      <circle cx="7.5" cy="18" r="1.5" />
      <circle cx="17.5" cy="18" r="1.5" />
    </>
  ),
  fuel: (
    <>
      <path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M3 21h13M8 7h3" />
      <path d="M15 8h2l3 3v6a2 2 0 0 1-4 0v-4" />
    </>
  ),
  logout: <path d="M10 17l5-5-5-5m5 5H3m9-9h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" />,
  maintenance: (
    <>
      <path d="M14.7 6.3a5 5 0 0 0-6.6 6.6L3 18l3 3 5.1-5.1a5 5 0 0 0 6.6-6.6L15 12l-3-3z" />
    </>
  ),
  moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
    </>
  ),
};

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}

function getTheme(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

const features = [
  {
    number: "01",
    icon: "fleet" as const,
    title: "Seus veículos, organizados",
    description:
      "Tenha os dados dos seus ativos em um só lugar e encontre as informações importantes sem depender de planilhas.",
    tag: "GESTÃO DE ATIVOS",
  },
  {
    number: "02",
    icon: "maintenance" as const,
    title: "Manutenção sem surpresas",
    description:
      "Acompanhe o cuidado com cada veículo e prepare sua operação para rodar com mais previsibilidade.",
    tag: "ROTINA EM DIA",
  },
  {
    number: "03",
    icon: "fuel" as const,
    title: "Custos sob controle",
    description:
      "Organize os custos da frota para tomar decisões com mais clareza e menos improviso.",
    tag: "VISÃO FINANCEIRA",
  },
];

const previewItems: { icon: IconName; label: string }[] = [
  { icon: "fleet", label: "Veículos" },
  { icon: "maintenance", label: "Manutenção" },
  { icon: "fuel", label: "Custos" },
];

type AuthenticatedUser = {
  id: number;
  email: string;
  companyName: string;
};

type VehicleStatus = "operational" | "maintenance" | "inactive";

type Vehicle = {
  id: number;
  plate: string;
  make: string;
  model: string;
  year: number;
  status: VehicleStatus;
};

type VehicleDraft = Omit<Vehicle, "id">;

const vehicleStatusLabels: Record<VehicleStatus, string> = {
  operational: "Operacional",
  maintenance: "Em manutenção",
  inactive: "Inativo",
};

export default function App() {
  if (window.location.pathname === "/login") {
    return <LoginPage />;
  }
  if (window.location.pathname === "/app") {
    return <DashboardPage />;
  }
  return <LandingPage />;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function LandingPage() {
  const [theme, setTheme] = useState<"light" | "dark">(getTheme);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("theme", next);
    setTheme(next);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f5] text-[#17221c] transition-colors dark:bg-[#101612] dark:text-[#eff4ef]">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a href="/" className="flex items-center gap-2.5" aria-label="FleetMonitor, início">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#c4f36b] text-[#17221c]">
            <Icon name="fleet" className="size-6" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            fleet<span className="text-[#71963b] dark:text-[#c4f36b]">monitor</span>
          </span>
        </a>

        <nav className="hidden items-center gap-9 text-sm font-medium text-[#657169] dark:text-[#a8b3aa] md:flex">
          <a className="transition hover:text-[#17221c] dark:hover:text-white" href="#inicio">
            Início
          </a>
          <a className="transition hover:text-[#17221c] dark:hover:text-white" href="#recursos">
            Recursos
          </a>
          <a className="transition hover:text-[#17221c] dark:hover:text-white" href="#sobre">
            Sobre a plataforma
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Ativar tema ${theme === "dark" ? "claro" : "escuro"}`}
            className="flex size-10 items-center justify-center rounded-full border border-[#e1e7df] text-[#4f5d53] transition hover:bg-white dark:border-[#303b33] dark:text-[#d6dfd7] dark:hover:bg-[#1b241d]"
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} className="size-[18px]" />
          </button>
          <a
            href="/login"
            className="inline-flex rounded-full bg-[#17221c] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#2b3b30] dark:bg-[#c4f36b] dark:text-[#17221c] dark:hover:bg-[#d2fb8d] sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Acessar plataforma
          </a>
        </div>
      </header>

      <section
        id="inicio"
        className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-16 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:px-12 lg:pb-32 lg:pt-20"
      >
        <div className="relative z-[1]">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dfe7d9] bg-white/70 px-3.5 py-2 text-xs font-semibold tracking-wide text-[#53644e] dark:border-[#354537] dark:bg-[#19211b] dark:text-[#c4f36b]">
            <span className="size-2 rounded-full bg-[#8eb94b]" />
            GESTÃO DE FROTAS, DE UM NOVO JEITO
          </div>
          <h1 className="max-w-2xl text-[clamp(2.8rem,6vw,5.25rem)] font-semibold leading-[1.04] tracking-[-0.055em]">
            Sua frota em movimento.
            <span className="mt-1 block text-[#71963b] dark:text-[#c4f36b]">
              Sua gestão no controle.
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-[#66736a] sm:text-lg sm:leading-8 dark:text-[#abb5ad]">
            Veículos, manutenção e custos conectados em uma plataforma feita para simplificar a
            rotina e dar mais clareza à sua operação.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#recursos"
              className="group inline-flex items-center gap-3 rounded-full bg-[#17221c] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2b3b30] dark:bg-[#c4f36b] dark:text-[#17221c] dark:hover:bg-[#d2fb8d]"
            >
              Conheça a plataforma
              <Icon
                name="arrow"
                className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
            <button
              type="button"
              className="rounded-full px-5 py-3.5 text-sm font-semibold text-[#536159] transition hover:bg-white dark:text-[#d6dfd7] dark:hover:bg-[#1b241d]"
            >
              Fale com a gente
            </button>
          </div>
          <div className="mt-10 flex items-center gap-3 text-sm text-[#758078] dark:text-[#99a59b]">
            <span className="flex -space-x-2">
              <span className="flex size-8 items-center justify-center rounded-full border-2 border-[#f7f8f5] bg-[#d8e7c5] text-[#506640] dark:border-[#101612]">
                <Icon name="check" className="size-4" />
              </span>
              <span className="flex size-8 items-center justify-center rounded-full border-2 border-[#f7f8f5] bg-[#e8e8d2] text-[#65704c] dark:border-[#101612]">
                <Icon name="fleet" className="size-4" />
              </span>
            </span>
            <span>Mais organização para quem move o negócio.</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[590px] lg:ml-auto">
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-[#dff4c2] blur-3xl dark:bg-[#294127]" />
          <div className="absolute -bottom-14 -left-10 size-52 rounded-full bg-[#e8e8ce] blur-3xl dark:bg-[#343b25]" />
          <div className="relative rounded-[2rem] border border-white/80 bg-white/75 p-3 shadow-[0_32px_100px_-45px_rgba(32,56,38,0.34)] backdrop-blur dark:border-[#303b33] dark:bg-[#19211b]/90 sm:p-5">
            <div className="rounded-[1.4rem] border border-[#edf0eb] bg-[#fbfcfa] p-5 dark:border-[#303b33] dark:bg-[#131a15] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[#849087] dark:text-[#9eaaa0]">
                    FLEETMONITOR
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
                    Sua operação, em perspectiva
                  </h2>
                </div>
                <span className="rounded-full bg-[#eff5e8] px-3 py-1.5 text-[10px] font-semibold tracking-wide text-[#648342] dark:bg-[#263522] dark:text-[#c4f36b]">
                  VISÃO GERAL
                </span>
              </div>

              <div className="relative mt-6 overflow-hidden rounded-2xl bg-[#edf2e9] p-5 dark:bg-[#202b22] sm:p-7">
                <div className="absolute inset-0 opacity-60">
                  <svg viewBox="0 0 500 210" className="size-full" preserveAspectRatio="none">
                    <path
                      d="M-20 158C82 146 99 43 201 61s104 117 195 69 92-67 132-78"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="5 8"
                      strokeWidth="2"
                      className="text-[#b8c9aa] dark:text-[#53694f]"
                    />
                    <path
                      d="M-20 178C82 166 99 63 201 81s104 117 195 69 92-67 132-78"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-[#d7e1d0] dark:text-[#364537]"
                    />
                  </svg>
                </div>
                <div className="relative flex min-h-36 items-center justify-center sm:min-h-44">
                  <div className="absolute left-[10%] top-[20%] flex size-9 items-center justify-center rounded-full border-4 border-white bg-[#c4f36b] text-[#24311f] shadow-md dark:border-[#263226]">
                    <span className="size-2 rounded-full bg-[#587838]" />
                  </div>
                  <div className="absolute right-[13%] top-[28%] flex size-8 items-center justify-center rounded-full border-4 border-white bg-white text-[#70856a] shadow-md dark:border-[#263226] dark:bg-[#344434]">
                    <span className="size-2 rounded-full bg-[#8eb94b]" />
                  </div>
                  <div className="absolute bottom-[12%] left-[37%] flex size-8 items-center justify-center rounded-full border-4 border-white bg-white text-[#70856a] shadow-md dark:border-[#263226] dark:bg-[#344434]">
                    <span className="size-2 rounded-full bg-[#8eb94b]" />
                  </div>
                  <div className="relative flex size-20 items-center justify-center rounded-[1.7rem] bg-[#17221c] text-[#c4f36b] shadow-xl shadow-[#31422d]/20 sm:size-24 dark:bg-[#c4f36b] dark:text-[#17221c]">
                    <Icon name="fleet" className="size-10 sm:size-11" />
                    <span className="absolute -bottom-2 -right-2 size-4 rounded-full border-[3px] border-[#edf2e9] bg-[#7ba648] dark:border-[#202b22]" />
                  </div>
                </div>
                <div className="relative mt-4 flex items-center justify-between border-t border-[#dce5d5] pt-4 text-xs text-[#6f7c70] dark:border-[#384639] dark:text-[#aeb9ad]">
                  <span>Ativos conectados à sua gestão</span>
                  <span className="flex items-center gap-1.5 font-medium text-[#638340] dark:text-[#c4f36b]">
                    <span className="size-1.5 rounded-full bg-[#8eb94b]" />
                    Visão centralizada
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {previewItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-[#edf0eb] bg-white p-3 dark:border-[#303b33] dark:bg-[#19211b] sm:p-4"
                  >
                    <Icon
                      name={item.icon}
                      className="size-5 text-[#789c4e] dark:text-[#c4f36b]"
                    />
                    <p className="mt-3 text-[11px] font-medium text-[#68746b] sm:text-xs dark:text-[#b1bbb2]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs text-[#9ba49c] dark:text-[#7f8b81]">Em um só lugar</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 py-3 text-[10px] font-medium tracking-[0.12em] text-[#909a91] dark:text-[#879389]">
              <span className="size-1.5 rounded-full bg-[#9fc66d]" />
              UMA VISÃO MAIS CLARA DA SUA FROTA
            </div>
          </div>
        </div>
      </section>

      <section
        id="recursos"
        className="border-y border-[#e8ece6] bg-white/65 py-20 sm:py-24 dark:border-[#28332b] dark:bg-[#151c17]"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#779b4d] dark:text-[#c4f36b]">
                MENOS COMPLEXIDADE. MAIS CONTROLE.
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
                Tudo o que sua frota precisa, em um só lugar.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#748078] dark:text-[#a7b2a9]">
              Uma base simples para organizar a operação hoje e crescer com confiança amanhã.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="group rounded-2xl border border-[#e8ece6] bg-[#fbfcfa] p-6 transition hover:-translate-y-1 hover:border-[#cbd9c0] hover:shadow-xl hover:shadow-[#35462c]/[0.06] sm:p-7 dark:border-[#303b33] dark:bg-[#19211b] dark:hover:border-[#506745]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-[#edf4e6] text-[#6d9144] transition group-hover:bg-[#c4f36b] group-hover:text-[#17221c] dark:bg-[#293627] dark:text-[#c4f36b]">
                    <Icon name={feature.icon} className="size-6" />
                  </span>
                  <span className="text-xs font-medium tracking-wide text-[#a2aaa3] dark:text-[#758178]">
                    {feature.number}
                  </span>
                </div>
                <p className="mt-7 text-[10px] font-semibold tracking-[0.16em] text-[#82966f] dark:text-[#a9c486]">
                  {feature.tag}
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#748078] dark:text-[#a7b2a9]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="sobre" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#17221c] px-6 py-12 text-white sm:px-12 sm:py-16 dark:bg-[#c4f36b] dark:text-[#17221c]">
          <div className="absolute -right-12 -top-32 size-80 rounded-full border border-white/10 dark:border-[#17221c]/10" />
          <div className="absolute -right-2 -top-20 size-60 rounded-full border border-white/10 dark:border-[#17221c]/10" />
          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#c4f36b] dark:text-[#496532]">
                FLEETMONITOR
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
                Sua operação merece rodar com mais tranquilidade.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 dark:text-[#33472a]">
                Estamos construindo uma forma mais simples de cuidar da sua frota, do primeiro
                veículo ao próximo destino.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-3 rounded-full bg-[#c4f36b] px-6 py-3.5 text-sm font-semibold text-[#17221c] transition hover:bg-[#d2fb8d] dark:bg-[#17221c] dark:text-white dark:hover:bg-[#2b3b30]"
            >
              Começar agora
              <Icon name="arrow" className="size-4" />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e8ece6] dark:border-[#28332b]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-xs text-[#849087] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12 dark:text-[#96a197]">
          <a href="#inicio" className="flex items-center gap-2 font-semibold text-[#526056] dark:text-[#d9e1da]">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#c4f36b] text-[#17221c]">
              <Icon name="fleet" className="size-4" />
            </span>
            fleetmonitor
          </a>
          <p>Gestão inteligente para quem mantém o mundo em movimento.</p>
          <p>© {new Date().getFullYear()} FleetMonitor</p>
        </div>
      </footer>
    </main>
  );
}

function LoginPage() {
  const [theme, setTheme] = useState<"light" | "dark">(getTheme);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Acessar plataforma — FleetMonitor";
    return () => {
      document.title = "FleetMonitor — Gestão inteligente de frotas";
    };
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("theme", next);
    setTheme(next);
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();
    const nextEmailError = !normalizedEmail
      ? "Informe seu e-mail."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)
        ? "Informe um e-mail válido, como admin@empresa.com."
        : null;
    const nextPasswordError = !password
      ? "Informe sua senha."
      : null;

    setEmail(normalizedEmail);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setMessage(null);

    if (nextEmailError || nextPasswordError) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (!response.ok) {
        const responseBody: unknown = await response.json();
        const errorMessage =
          isRecord(responseBody) && typeof responseBody.error === "string"
            ? responseBody.error
            : "Não foi possível entrar. Tente novamente.";
        setMessage(errorMessage);
        return;
      }

      window.location.assign("/app");
    } catch {
      setMessage("Não foi possível conectar à plataforma. Verifique se a API está em execução.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#17221c] transition-colors dark:bg-[#101612] dark:text-[#eff4ef]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a href="/" className="flex items-center gap-2.5" aria-label="Voltar à página inicial">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#c4f36b] text-[#17221c]">
            <Icon name="fleet" className="size-6" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            fleet<span className="text-[#71963b] dark:text-[#c4f36b]">monitor</span>
          </span>
        </a>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Ativar tema ${theme === "dark" ? "claro" : "escuro"}`}
          className="flex size-10 items-center justify-center rounded-full border border-[#e1e7df] text-[#4f5d53] transition hover:bg-white dark:border-[#303b33] dark:text-[#d6dfd7] dark:hover:bg-[#1b241d]"
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} className="size-[18px]" />
        </button>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-81px)] max-w-7xl items-center gap-12 px-5 pb-12 pt-8 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:gap-20 lg:px-12 lg:pb-20">
        <div className="hidden max-w-xl lg:block">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dfe7d9] bg-white/70 px-3.5 py-2 text-xs font-semibold tracking-wide text-[#53644e] dark:border-[#354537] dark:bg-[#19211b] dark:text-[#c4f36b]">
            <span className="size-2 rounded-full bg-[#8eb94b]" />
            SEU CENTRO DE OPERAÇÕES
          </div>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.05em] xl:text-6xl">
            Bom ter você de volta à{" "}
            <span className="text-[#71963b] dark:text-[#c4f36b]">direção.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-[#66736a] dark:text-[#abb5ad]">
            Acesse sua área de gestão e mantenha sua operação em movimento.
          </p>
          <div className="mt-12 max-w-md rounded-3xl border border-[#e5eae2] bg-white/70 p-6 dark:border-[#303b33] dark:bg-[#19211b]">
            <div className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#edf4e6] text-[#6d9144] dark:bg-[#293627] dark:text-[#c4f36b]">
                <Icon name="fleet" className="size-6" />
              </span>
              <div>
                <p className="font-semibold">Sua frota, em perspectiva</p>
                <p className="mt-1 text-sm text-[#748078] dark:text-[#a7b2a9]">
                  Veículos, manutenção e custos conectados.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 border-t border-[#e8ece6] pt-5 text-xs text-[#748078] dark:border-[#303b33] dark:text-[#a7b2a9]">
              <span className="size-2 rounded-full bg-[#8eb94b]" />
              Gestão simples para operações que não param.
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[1.75rem] border border-[#e7ebe5] bg-white p-6 shadow-[0_28px_80px_-44px_rgba(32,56,38,0.32)] sm:p-9 dark:border-[#303b33] dark:bg-[#19211b]">
            <a
              href="/"
              className="text-sm font-medium text-[#748078] transition hover:text-[#17221c] dark:text-[#a7b2a9] dark:hover:text-white"
            >
              ← Voltar ao início
            </a>
            <p className="mt-8 text-xs font-semibold tracking-[0.16em] text-[#779b4d] dark:text-[#c4f36b]">
              ÁREA DO CLIENTE
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Acessar plataforma</h2>
            <p className="mt-2 text-sm leading-6 text-[#748078] dark:text-[#a7b2a9]">
              Entre com os dados da sua conta FleetMonitor.
            </p>

            <form className="mt-8 space-y-5" noValidate onSubmit={submitLogin}>
              <div className="flex flex-col gap-2">
                <label htmlFor="login-email" className="text-sm font-medium">
                  E-mail
                </label>
                <input
                  id="login-email"
                  required
                  type="email"
                  autoComplete="username"
                  value={email}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "login-email-error" : undefined}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setEmailError(null);
                    setMessage(null);
                  }}
                  placeholder="admin@empresa.com"
                  className={`w-full rounded-xl border bg-[#fcfdfb] px-4 py-3 text-sm outline-none transition placeholder:text-[#a0aaa1] focus:ring-4 focus:ring-[#c4f36b]/20 dark:bg-[#131a15] dark:placeholder:text-[#758178] ${
                    emailError
                      ? "border-red-400 focus:border-red-500 dark:border-red-500"
                      : "border-[#dfe5dd] focus:border-[#8eb94b] dark:border-[#3b473d] dark:focus:border-[#9ecb5d]"
                  }`}
                />
                {emailError && (
                  <span id="login-email-error" className="text-xs text-red-600 dark:text-red-400">
                    {emailError}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="login-password" className="text-sm font-medium">
                  Senha
                </label>
                <span className="relative">
                  <input
                    id="login-password"
                    required
                    minLength={1}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={passwordError ? "login-password-error" : "login-password-hint"}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setPasswordError(null);
                      setMessage(null);
                    }}
                    placeholder="Digite sua senha"
                    className={`w-full rounded-xl border bg-[#fcfdfb] px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-[#a0aaa1] focus:ring-4 focus:ring-[#c4f36b]/20 dark:bg-[#131a15] dark:placeholder:text-[#758178] ${
                      passwordError
                        ? "border-red-400 focus:border-red-500 dark:border-red-500"
                        : "border-[#dfe5dd] focus:border-[#8eb94b] dark:border-[#3b473d] dark:focus:border-[#9ecb5d]"
                    }`}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-[#839087] transition hover:text-[#354238] dark:hover:text-white"
                  >
                    <Icon name={showPassword ? "eyeOff" : "eye"} className="size-[18px]" />
                  </button>
                </span>
                {passwordError ? (
                  <span id="login-password-error" className="text-xs text-red-600 dark:text-red-400">
                    {passwordError}
                  </span>
                ) : (
                  <span id="login-password-hint" className="text-xs text-[#879188] dark:text-[#94a096]">
                    Senha da empresa.
                  </span>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setMessage("Para esta demonstração, use a conta de acesso exibida abaixo.")
                  }
                  className="text-sm font-medium text-[#66883f] transition hover:text-[#4f6d30] dark:text-[#c4f36b] dark:hover:text-[#d2fb8d]"
                >
                  Esqueci minha senha
                </button>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17221c] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2b3b30] disabled:cursor-wait disabled:opacity-70 dark:bg-[#c4f36b] dark:text-[#17221c] dark:hover:bg-[#d2fb8d]"
              >
                {isSubmitting ? "Verificando..." : "Entrar"}
                <Icon name="arrow" className="size-4" />
              </button>
            </form>

            {message && (
              <p
                role="status"
                className="mt-5 rounded-xl border border-[#dce9ce] bg-[#f3f8ed] px-4 py-3 text-sm leading-5 text-[#526a3f] dark:border-[#43563a] dark:bg-[#222e1f] dark:text-[#d2e8bc]"
              >
                {message}
              </p>
            )}

            <p className="mt-5 rounded-xl bg-[#f3f6ef] px-4 py-3 text-xs leading-5 text-[#617153] dark:bg-[#222e1f] dark:text-[#c1d2b4]">
              Acesso de demonstração: <strong>admin@empresa.com</strong>
              <br />
              Senha: <strong>1234</strong>
            </p>

            <p className="mt-8 border-t border-[#e8ece6] pt-5 text-center text-xs leading-5 text-[#879188] dark:border-[#303b33] dark:text-[#94a096]">
              Ainda não tem acesso?{" "}
              <a
                href="/#sobre"
                className="font-semibold text-[#66883f] hover:underline dark:text-[#c4f36b]"
              >
                Fale com a nossa equipe
              </a>
            </p>
          </div>
          <p className="mt-5 text-center text-xs text-[#929c93] dark:text-[#849087]">
            Acesso seguro para a gestão da sua operação.
          </p>
        </div>
      </section>
    </main>
  );
}

function DashboardPage() {
  const [theme, setTheme] = useState<"light" | "dark">(getTheme);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VehicleStatus>("all");
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [draft, setDraft] = useState<VehicleDraft>(emptyVehicleDraft());

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [sessionResponse, vehiclesResponse] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/vehicles"),
        ]);
        if (sessionResponse.status === 401 || vehiclesResponse.status === 401) {
          window.location.replace("/login");
          return;
        }
        if (!sessionResponse.ok || !vehiclesResponse.ok) {
          throw new Error("Não foi possível carregar os dados da frota.");
        }

        const [sessionPayload, vehiclesPayload]: [unknown, unknown] = await Promise.all([
          sessionResponse.json(),
          vehiclesResponse.json(),
        ]);
        if (
          !isRecord(sessionPayload) ||
          !isRecord(sessionPayload.user) ||
          typeof sessionPayload.user.id !== "number" ||
          typeof sessionPayload.user.email !== "string" ||
          typeof sessionPayload.user.companyName !== "string" ||
          !Array.isArray(vehiclesPayload) ||
          !vehiclesPayload.every(isVehicle)
        ) {
          throw new Error("A resposta da API está em um formato inválido.");
        }
        if (active) {
          setUser({
            id: sessionPayload.user.id,
            email: sessionPayload.user.email,
            companyName: sessionPayload.user.companyName,
          });
          setVehicles(vehiclesPayload);
        }
      } catch {
        if (active) {
          setError("Não foi possível carregar a frota. Verifique se a API está disponível.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      normalizedQuery.length === 0 ||
      `${vehicle.plate} ${vehicle.make} ${vehicle.model} ${vehicle.year}`
        .toLowerCase()
        .includes(normalizedQuery);
    return matchesStatus && matchesQuery;
  });

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("theme", next);
    setTheme(next);
  }

  function openCreateVehicle() {
    setEditingVehicle(null);
    setDraft(emptyVehicleDraft());
    setError(null);
    setIsVehicleFormOpen(true);
  }

  function openEditVehicle(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setDraft({
      plate: vehicle.plate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      status: vehicle.status,
    });
    setError(null);
    setIsVehicleFormOpen(true);
  }

  async function saveVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(
        editingVehicle ? `/api/vehicles/${editingVehicle.id}` : "/api/vehicles",
        {
          method: editingVehicle ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...draft, plate: draft.plate.trim().toUpperCase() }),
        },
      );

      if (!response.ok) {
        const payload: unknown = await response.json();
        setError(
          isRecord(payload) && typeof payload.error === "string"
            ? payload.error
            : "Não foi possível salvar o veículo.",
        );
        return;
      }

      const savedVehicle: unknown = await response.json();
      if (!isVehicle(savedVehicle)) {
        throw new Error("A resposta da API está em um formato inválido.");
      }

      setVehicles((current) =>
        editingVehicle
          ? current.map((vehicle) => (vehicle.id === savedVehicle.id ? savedVehicle : vehicle))
          : [...current, savedVehicle].sort((a, b) => a.plate.localeCompare(b.plate)),
      );
      setNotice(editingVehicle ? "Veículo atualizado com sucesso." : "Veículo cadastrado com sucesso.");
      setIsVehicleFormOpen(false);
    } catch {
      setError("Não foi possível conectar à API para salvar o veículo.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteVehicle(vehicle: Vehicle) {
    if (!window.confirm(`Deseja remover o veículo ${vehicle.plate}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload: unknown = await response.json();
        setError(
          isRecord(payload) && typeof payload.error === "string"
            ? payload.error
            : "Não foi possível remover o veículo.",
        );
        return;
      }
      setVehicles((current) => current.filter((item) => item.id !== vehicle.id));
      setNotice(`Veículo ${vehicle.plate} removido.`);
    } catch {
      setError("Não foi possível conectar à API para remover o veículo.");
    }
  }

  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Não foi possível encerrar a sessão.");
      }
      window.location.assign("/login");
    } catch {
      setError("Não foi possível encerrar a sessão. Tente novamente.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f6f2] text-[#17221c] dark:bg-[#101612] dark:text-[#eff4ef]">
      <div className="min-h-screen lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#e6ebe4] bg-white px-5 py-7 dark:border-[#28332b] dark:bg-[#151c17] lg:flex lg:flex-col">
          <a href="/" className="flex items-center gap-2.5 px-2" aria-label="FleetMonitor, início">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#c4f36b] text-[#17221c]">
              <Icon name="fleet" className="size-6" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              fleet<span className="text-[#71963b] dark:text-[#c4f36b]">monitor</span>
            </span>
          </a>
          <p className="mb-3 mt-12 px-3 text-[10px] font-semibold tracking-[0.16em] text-[#97a198]">
            GESTÃO DA FROTA
          </p>
          <a
            href="#veiculos"
            className="flex items-center gap-3 rounded-xl bg-[#edf4e6] px-3 py-3 text-sm font-semibold text-[#526f37] dark:bg-[#293627] dark:text-[#c4f36b]"
          >
            <Icon name="fleet" className="size-[18px]" />
            Veículos
          </a>
          <div className="mt-auto rounded-2xl bg-[#f3f6ef] p-4 dark:bg-[#202a21]">
            <p className="text-xs font-semibold">FleetMonitor</p>
            <p className="mt-1 text-xs leading-5 text-[#748078] dark:text-[#a7b2a9]">
              Gestão simples para sua operação.
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="flex items-center justify-between border-b border-[#e6ebe4] bg-white px-5 py-4 dark:border-[#28332b] dark:bg-[#151c17] sm:px-8 lg:px-10">
            <a href="/" className="flex items-center gap-2.5 lg:hidden" aria-label="FleetMonitor, início">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#c4f36b] text-[#17221c]">
                <Icon name="fleet" className="size-5" />
              </span>
              <span className="font-semibold tracking-tight">
                fleet<span className="text-[#71963b] dark:text-[#c4f36b]">monitor</span>
              </span>
            </a>
            <div className="hidden text-sm text-[#748078] dark:text-[#a7b2a9] lg:block">
              Painel da empresa <span className="mx-2 text-[#cbd2ca]">/</span>{" "}
              <span className="font-medium text-[#17221c] dark:text-[#eff4ef]">Veículos</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {user && (
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold">{user.companyName}</p>
                  <p className="text-xs text-[#849087]">{user.email}</p>
                </div>
              )}
              <span className="flex size-10 items-center justify-center rounded-full bg-[#e7efdf] text-sm font-semibold text-[#526f37] dark:bg-[#293627] dark:text-[#c4f36b]">
                {user?.companyName.slice(0, 1).toUpperCase() ?? "F"}
              </span>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Ativar tema ${theme === "dark" ? "claro" : "escuro"}`}
                className="flex size-10 items-center justify-center rounded-xl border border-[#e1e7df] text-[#526056] transition hover:bg-[#f5f7f3] dark:border-[#303b33] dark:text-[#d9e1da] dark:hover:bg-[#1b241d]"
              >
                <Icon name={theme === "dark" ? "sun" : "moon"} className="size-[18px]" />
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e1e7df] px-3 py-2 text-sm font-medium text-[#526056] transition hover:bg-[#f5f7f3] dark:border-[#303b33] dark:text-[#d9e1da] dark:hover:bg-[#1b241d]"
              >
                <Icon name="logout" className="size-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </header>

          <section id="veiculos" className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
            {error && !isVehicleFormOpen && (
              <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="mb-5 rounded-xl bg-[#edf4e6] px-4 py-3 text-sm text-[#526f37] dark:bg-[#293627] dark:text-[#c4f36b]">
                {notice}
              </p>
            )}

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-[#779b4d] dark:text-[#c4f36b]">
                  VISÃO GERAL
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                  Olá, {user?.companyName ?? "gestor"}.
                </h1>
                <p className="mt-2 text-sm text-[#748078] dark:text-[#a7b2a9]">
                  Acompanhe os veículos e a situação atual da sua frota.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateVehicle}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17221c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2b3b30] dark:bg-[#c4f36b] dark:text-[#17221c] dark:hover:bg-[#d2fb8d]"
              >
                <Icon name="plus" className="size-[18px]" />
                Cadastrar veículo
              </button>
            </div>

            {isLoading ? (
              <p className="mt-10 text-sm text-[#748078] dark:text-[#a7b2a9]">
                Carregando dados da frota...
              </p>
            ) : error && !user ? (
              <p role="alert" className="mt-10 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : (
              <>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <DashboardStat
                    label="Total de veículos"
                    value={vehicles.length}
                    icon="fleet"
                    detail="Veículos cadastrados"
                  />
                  <DashboardStat
                    label="Operacionais"
                    value={vehicles.filter((vehicle) => vehicle.status === "operational").length}
                    icon="check"
                    detail="Disponíveis para operação"
                    tone="green"
                  />
                  <DashboardStat
                    label="Em manutenção"
                    value={vehicles.filter((vehicle) => vehicle.status === "maintenance").length}
                    icon="maintenance"
                    detail="Precisam de acompanhamento"
                    tone="amber"
                  />
                  <DashboardStat
                    label="Inativos"
                    value={vehicles.filter((vehicle) => vehicle.status === "inactive").length}
                    icon="fuel"
                    detail="Fora de operação"
                    tone="slate"
                  />
                </div>

                <div className="mt-8 overflow-hidden rounded-2xl border border-[#e5eae2] bg-white dark:border-[#303b33] dark:bg-[#19211b]">
                  <div className="flex flex-col gap-4 border-b border-[#edf0eb] p-5 dark:border-[#303b33] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                      <h2 className="text-lg font-semibold">Veículos da frota</h2>
                      <p className="mt-1 text-xs text-[#849087]">
                        {filteredVehicles.length} de {vehicles.length} veículos
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <label className="relative">
                        <span className="sr-only">Buscar veículo</span>
                        <Icon name="search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b968d]" />
                        <input
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Placa, marca ou modelo"
                          className="w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#8eb94b] focus:ring-4 focus:ring-[#c4f36b]/20 dark:border-[#3b473d] dark:bg-[#131a15] sm:w-56"
                        />
                      </label>
                      <label>
                        <span className="sr-only">Filtrar por status</span>
                        <select
                          value={statusFilter}
                          onChange={(event) => {
                            const value = event.target.value;
                            if (
                              value === "all" ||
                              value === "operational" ||
                              value === "maintenance" ||
                              value === "inactive"
                            ) {
                              setStatusFilter(value);
                            }
                          }}
                          className="w-full rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 text-sm outline-none focus:border-[#8eb94b] dark:border-[#3b473d] dark:bg-[#131a15] sm:w-44"
                        >
                          <option value="all">Todos os status</option>
                          <option value="operational">Operacional</option>
                          <option value="maintenance">Em manutenção</option>
                          <option value="inactive">Inativo</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  {filteredVehicles.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#edf4e6] text-[#6d9144] dark:bg-[#293627] dark:text-[#c4f36b]">
                        <Icon name="fleet" className="size-6" />
                      </span>
                      <h3 className="mt-4 font-semibold">
                        {vehicles.length === 0 ? "Sua frota começa aqui" : "Nenhum veículo encontrado"}
                      </h3>
                      <p className="mx-auto mt-1 max-w-sm text-sm text-[#748078] dark:text-[#a7b2a9]">
                        {vehicles.length === 0
                          ? "Cadastre o primeiro veículo para começar a acompanhar sua operação."
                          : "Tente ajustar a busca ou selecionar outro status."}
                      </p>
                      {vehicles.length === 0 && (
                        <button
                          type="button"
                          onClick={openCreateVehicle}
                          className="mt-5 text-sm font-semibold text-[#66883f] hover:underline dark:text-[#c4f36b]"
                        >
                          Cadastrar primeiro veículo
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-[#f8faf7] text-xs font-medium text-[#77837a] dark:bg-[#151c17] dark:text-[#a7b2a9]">
                            <tr>
                              <th className="px-6 py-3.5">Veículo</th>
                              <th className="px-6 py-3.5">Placa</th>
                              <th className="px-6 py-3.5">Ano</th>
                              <th className="px-6 py-3.5">Status</th>
                              <th className="px-6 py-3.5 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#edf0eb] dark:divide-[#303b33]">
                            {filteredVehicles.map((vehicle) => (
                              <tr key={vehicle.id} className="transition hover:bg-[#fbfcfa] dark:hover:bg-[#202a21]">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#edf4e6] text-[#6d9144] dark:bg-[#293627] dark:text-[#c4f36b]">
                                      <Icon name="fleet" className="size-5" />
                                    </span>
                                    <span>
                                      <span className="block font-semibold">{vehicle.make} {vehicle.model}</span>
                                      <span className="mt-0.5 block text-xs text-[#849087]">Veículo #{vehicle.id}</span>
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-medium tracking-wide">{vehicle.plate}</td>
                                <td className="px-6 py-4 text-[#66736a] dark:text-[#b1bbb2]">{vehicle.year}</td>
                                <td className="px-6 py-4"><VehicleStatusBadge status={vehicle.status} /></td>
                                <td className="px-6 py-4">
                                  <VehicleActions
                                    vehicle={vehicle}
                                    onEdit={openEditVehicle}
                                    onDelete={deleteVehicle}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="divide-y divide-[#edf0eb] md:hidden dark:divide-[#303b33]">
                        {filteredVehicles.map((vehicle) => (
                          <article key={vehicle.id} className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4e6] text-[#6d9144] dark:bg-[#293627] dark:text-[#c4f36b]">
                                  <Icon name="fleet" className="size-5" />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold">{vehicle.make} {vehicle.model}</p>
                                  <p className="mt-1 text-xs text-[#849087]">{vehicle.plate} · {vehicle.year}</p>
                                </div>
                              </div>
                              <VehicleStatusBadge status={vehicle.status} />
                            </div>
                            <div className="mt-4 flex justify-end">
                              <VehicleActions
                                vehicle={vehicle}
                                onEdit={openEditVehicle}
                                onDelete={deleteVehicle}
                              />
                            </div>
                          </article>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        {isVehicleFormOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-[#101612]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isSaving) {
                setIsVehicleFormOpen(false);
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="vehicle-form-title"
              className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-[#19211b] sm:rounded-3xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-[#779b4d] dark:text-[#c4f36b]">
                    GESTÃO DE ATIVOS
                  </p>
                  <h2 id="vehicle-form-title" className="mt-2 text-2xl font-semibold tracking-tight">
                    {editingVehicle ? "Editar veículo" : "Cadastrar veículo"}
                  </h2>
                  <p className="mt-1 text-sm text-[#748078] dark:text-[#a7b2a9]">
                    Preencha os dados para manter o cadastro da frota atualizado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVehicleFormOpen(false)}
                  disabled={isSaving}
                  aria-label="Fechar formulário"
                  className="rounded-lg px-3 py-2 text-sm text-[#748078] hover:bg-[#f3f6ef] dark:hover:bg-[#263226]"
                >
                  Fechar
                </button>
              </div>

              {error && (
                <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              )}

              <form onSubmit={saveVehicle} className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Placa</span>
                  <input
                    required
                    maxLength={7}
                    pattern="[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}"
                    title="Informe uma placa válida com 7 caracteres."
                    value={draft.plate}
                    onChange={(event) => setDraft((current) => ({ ...current, plate: event.target.value }))}
                    placeholder="ABC1D23"
                    className="rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-4 py-3 text-sm uppercase outline-none focus:border-[#8eb94b] focus:ring-4 focus:ring-[#c4f36b]/20 dark:border-[#3b473d] dark:bg-[#131a15]"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Ano</span>
                  <input
                    required
                    type="number"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    value={draft.year}
                    onChange={(event) => setDraft((current) => ({ ...current, year: Number(event.target.value) }))}
                    className="rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-4 py-3 text-sm outline-none focus:border-[#8eb94b] focus:ring-4 focus:ring-[#c4f36b]/20 dark:border-[#3b473d] dark:bg-[#131a15]"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Marca</span>
                  <input
                    required
                    maxLength={100}
                    value={draft.make}
                    onChange={(event) => setDraft((current) => ({ ...current, make: event.target.value }))}
                    placeholder="Ex.: Fiat"
                    className="rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-4 py-3 text-sm outline-none focus:border-[#8eb94b] focus:ring-4 focus:ring-[#c4f36b]/20 dark:border-[#3b473d] dark:bg-[#131a15]"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Modelo</span>
                  <input
                    required
                    maxLength={100}
                    value={draft.model}
                    onChange={(event) => setDraft((current) => ({ ...current, model: event.target.value }))}
                    placeholder="Ex.: Ducato"
                    className="rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-4 py-3 text-sm outline-none focus:border-[#8eb94b] focus:ring-4 focus:ring-[#c4f36b]/20 dark:border-[#3b473d] dark:bg-[#131a15]"
                  />
                </label>
                <label className="flex flex-col gap-2 sm:col-span-2">
                  <span className="text-sm font-medium">Status</span>
                  <select
                    value={draft.status}
                    onChange={(event) => {
                      const status = event.target.value;
                      if (isVehicleStatus(status)) {
                        setDraft((current) => ({ ...current, status }));
                      }
                    }}
                    className="rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-4 py-3 text-sm outline-none focus:border-[#8eb94b] dark:border-[#3b473d] dark:bg-[#131a15]"
                  >
                    <option value="operational">Operacional</option>
                    <option value="maintenance">Em manutenção</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </label>
                <div className="mt-2 flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsVehicleFormOpen(false)}
                    disabled={isSaving}
                    className="rounded-xl border border-[#dfe5dd] px-5 py-3 text-sm font-semibold transition hover:bg-[#f6f8f4] disabled:opacity-60 dark:border-[#3b473d] dark:hover:bg-[#263226]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-[#17221c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2b3b30] disabled:cursor-wait disabled:opacity-60 dark:bg-[#c4f36b] dark:text-[#17221c] dark:hover:bg-[#d2fb8d]"
                  >
                    {isSaving ? "Salvando..." : editingVehicle ? "Salvar alterações" : "Cadastrar veículo"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function emptyVehicleDraft(): VehicleDraft {
  return {
    plate: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    status: "operational",
  };
}

function isVehicleStatus(value: string): value is VehicleStatus {
  return value === "operational" || value === "maintenance" || value === "inactive";
}

function isVehicle(value: unknown): value is Vehicle {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.plate === "string" &&
    typeof value.make === "string" &&
    typeof value.model === "string" &&
    typeof value.year === "number" &&
    typeof value.status === "string" &&
    isVehicleStatus(value.status)
  );
}

function DashboardStat({
  label,
  value,
  icon,
  detail,
  tone = "green",
}: {
  label: string;
  value: number;
  icon: IconName;
  detail: string;
  tone?: "green" | "amber" | "slate";
}) {
  const toneClass = {
    green: "bg-[#edf4e6] text-[#6d9144] dark:bg-[#293627] dark:text-[#c4f36b]",
    amber: "bg-[#fbf2df] text-[#a77a25] dark:bg-[#3a3020] dark:text-[#e5c16c]",
    slate: "bg-[#edf0ee] text-[#69776e] dark:bg-[#29312c] dark:text-[#b8c4bb]",
  }[tone];

  return (
    <article className="rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-[#303b33] dark:bg-[#19211b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[#748078] dark:text-[#a7b2a9]">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className={`flex size-10 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon name={icon} className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-[#929c93] dark:text-[#879389]">{detail}</p>
    </article>
  );
}

function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const colorClass = {
    operational: "bg-[#edf5e7] text-[#5f813e] dark:bg-[#293627] dark:text-[#c4f36b]",
    maintenance: "bg-[#fbf2df] text-[#98701f] dark:bg-[#3a3020] dark:text-[#e5c16c]",
    inactive: "bg-[#edf0ee] text-[#68756c] dark:bg-[#29312c] dark:text-[#b8c4bb]",
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colorClass}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {vehicleStatusLabels[status]}
    </span>
  );
}

function VehicleActions({
  vehicle,
  onEdit,
  onDelete,
}: {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onEdit(vehicle)}
        className="rounded-lg border border-[#e1e7df] px-3 py-1.5 text-xs font-medium text-[#526056] transition hover:bg-[#f3f6ef] dark:border-[#3b473d] dark:text-[#d9e1da] dark:hover:bg-[#263226]"
      >
        Editar
      </button>
      <button
        type="button"
        onClick={() => onDelete(vehicle)}
        className="rounded-lg border border-[#f0dada] px-3 py-1.5 text-xs font-medium text-[#a34848] transition hover:bg-[#fff4f4] dark:border-[#573838] dark:text-[#f2aaaa] dark:hover:bg-[#352323]"
      >
        Remover
      </button>
    </div>
  );
}

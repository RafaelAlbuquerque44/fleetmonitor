import { useState, type FormEvent } from "react";
import { Icon, type IconName } from "../components/Icon";
import { submitContactRequest } from "../features/contact/api";
import { getTheme } from "../lib/theme";

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

export function LandingPage() {
  const [theme, setTheme] = useState<"light" | "dark">(getTheme);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("theme", next);
    setTheme(next);
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setContactError(null);
    setIsContactSubmitting(true);

    try {
      await submitContactRequest({
        name: contactName,
        email: contactEmail,
        companyName: contactCompany,
        message: contactMessage,
      });
      setContactSubmitted(true);
      setContactName("");
      setContactEmail("");
      setContactCompany("");
      setContactMessage("");
    } catch (error) {
      setContactError(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar sua mensagem. Tente novamente.",
      );
    } finally {
      setIsContactSubmitting(false);
    }
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
            <a
              href="#contato"
              className="rounded-full px-5 py-3.5 text-sm font-semibold text-[#536159] transition hover:bg-white dark:text-[#d6dfd7] dark:hover:bg-[#1b241d]"
            >
              Fale com a gente
            </a>
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
            <a
              href="/login"
              className="inline-flex shrink-0 items-center gap-3 rounded-full bg-[#c4f36b] px-6 py-3.5 text-sm font-semibold text-[#17221c] transition hover:bg-[#d2fb8d] dark:bg-[#17221c] dark:text-white dark:hover:bg-[#2b3b30]"
            >
              Começar agora
              <Icon name="arrow" className="size-4" />
            </a>
          </div>
        </div>
      </section>

      <section
        id="contato"
        className="border-t border-[#e8ece6] bg-white/65 py-20 dark:border-[#28332b] dark:bg-[#151c17] sm:py-24"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-12">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#779b4d] dark:text-[#c4f36b]">
              FALE COM A GENTE
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
              Vamos conversar sobre sua frota?
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#748078] dark:text-[#a7b2a9]">
              Envie sua mensagem. Ela será registrada para que nossa equipe possa consultá-la e
              retornar pelo e-mail informado.
            </p>
          </div>

          <form
            onSubmit={submitContact}
            className="grid gap-4 rounded-2xl border border-[#e5eae2] bg-white p-5 dark:border-[#303b33] dark:bg-[#19211b] sm:grid-cols-2 sm:p-7"
          >
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Nome</span>
              <input
                required
                maxLength={120}
                autoComplete="name"
                value={contactName}
                onChange={(event) => {
                  setContactName(event.target.value);
                  setContactSubmitted(false);
                  setContactError(null);
                }}
                className="rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-4 py-3 text-sm outline-none focus:border-[#8eb94b] focus:ring-4 focus:ring-[#c4f36b]/20 dark:border-[#3b473d] dark:bg-[#131a15]"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">E-mail</span>
              <input
                required
                type="email"
                maxLength={254}
                autoComplete="email"
                value={contactEmail}
                onChange={(event) => {
                  setContactEmail(event.target.value);
                  setContactSubmitted(false);
                  setContactError(null);
                }}
                className="rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-4 py-3 text-sm outline-none focus:border-[#8eb94b] focus:ring-4 focus:ring-[#c4f36b]/20 dark:border-[#3b473d] dark:bg-[#131a15]"
              />
            </label>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Empresa <span className="font-normal text-[#849087]">(opcional)</span></span>
              <input
                maxLength={120}
                autoComplete="organization"
                value={contactCompany}
                onChange={(event) => {
                  setContactCompany(event.target.value);
                  setContactSubmitted(false);
                  setContactError(null);
                }}
                className="rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-4 py-3 text-sm outline-none focus:border-[#8eb94b] focus:ring-4 focus:ring-[#c4f36b]/20 dark:border-[#3b473d] dark:bg-[#131a15]"
              />
            </label>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Como podemos ajudar?</span>
              <textarea
                required
                maxLength={5000}
                rows={5}
                value={contactMessage}
                onChange={(event) => {
                  setContactMessage(event.target.value);
                  setContactSubmitted(false);
                  setContactError(null);
                }}
                className="resize-y rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-4 py-3 text-sm outline-none focus:border-[#8eb94b] focus:ring-4 focus:ring-[#c4f36b]/20 dark:border-[#3b473d] dark:bg-[#131a15]"
              />
            </label>
            {contactError && (
              <p role="alert" className="sm:col-span-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {contactError}
              </p>
            )}
            {contactSubmitted && (
              <p role="status" className="sm:col-span-2 rounded-xl bg-[#edf4e6] px-4 py-3 text-sm text-[#526f37] dark:bg-[#293627] dark:text-[#c4f36b]">
                Mensagem registrada. Nossa equipe poderá consultá-la e retornar pelo e-mail informado.
              </p>
            )}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isContactSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#17221c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2b3b30] disabled:cursor-wait disabled:opacity-60 dark:bg-[#c4f36b] dark:text-[#17221c] dark:hover:bg-[#d2fb8d]"
              >
                {isContactSubmitting ? "Enviando..." : "Enviar mensagem"}
                <Icon name="arrow" className="size-4" />
              </button>
            </div>
          </form>
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

import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "../components/Icon";
import { AuthApiError, login } from "../features/auth/api";
import { getTheme } from "../lib/theme";

export function LoginPage() {
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
        ? "Informe um e-mail válido."
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
      const readOnly = await login(normalizedEmail, password);
      window.location.assign(readOnly ? "/app/overview" : "/app");
    } catch (error) {
      setMessage(
        error instanceof AuthApiError
          ? error.message
          : "Não foi possível conectar à plataforma. Verifique se a API está em execução.",
      );
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
                  placeholder="seu@email.com"
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

            <p className="mt-8 border-t border-[#e8ece6] pt-5 text-center text-xs leading-5 text-[#879188] dark:border-[#303b33] dark:text-[#94a096]">
              Ainda não tem acesso?{" "}
              <a
                href="/#contato"
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

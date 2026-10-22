export type AuthenticatedUser = {
  id: number;
  email: string;
  companyName: string;
  readOnly: boolean;
};

export class AuthApiError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (isRecord(payload) && typeof payload.error === "string") {
      return payload.error;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

export async function login(email: string, password: string): Promise<boolean> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new AuthApiError(
      await readError(response, "Não foi possível entrar. Tente novamente."),
    );
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || !isRecord(payload.user) || typeof payload.user.readOnly !== "boolean") {
    throw new AuthApiError("A resposta da API está em um formato inválido.");
  }
  return payload.user.readOnly;
}

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  const response = await fetch("/api/auth/me");
  if (!response.ok) {
    if (response.status === 401) {
      window.location.replace("/login");
    }
    throw new AuthApiError("Não foi possível carregar a conta autenticada.");
  }

  const payload: unknown = await response.json();
  if (
    !isRecord(payload) ||
    !isRecord(payload.user) ||
    typeof payload.user.id !== "number" ||
    typeof payload.user.email !== "string" ||
    typeof payload.user.companyName !== "string" ||
    typeof payload.user.readOnly !== "boolean"
  ) {
    throw new AuthApiError("A resposta da API está em um formato inválido.");
  }

  return {
    id: payload.user.id,
    email: payload.user.email,
    companyName: payload.user.companyName,
    readOnly: payload.user.readOnly,
  };
}

export async function logout(): Promise<void> {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  if (!response.ok) {
    throw new Error("Não foi possível encerrar a sessão.");
  }
  window.location.assign("/login");
}

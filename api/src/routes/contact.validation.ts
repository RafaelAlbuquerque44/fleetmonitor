export type ContactRequestInput = {
  name: string;
  email: string;
  companyName: string | null;
  message: string;
};

export type ContactRequestResult =
  | { value: ContactRequestInput }
  | { error: string };

export function parseContactRequest(payload: unknown): ContactRequestResult {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { error: "Preencha os dados do formulário." };
  }

  const values = payload as Record<string, unknown>;
  const name = typeof values.name === "string" ? values.name.trim() : "";
  const email = typeof values.email === "string" ? values.email.trim().toLowerCase() : "";
  const companyName =
    typeof values.companyName === "string" ? values.companyName.trim() : "";
  const message = typeof values.message === "string" ? values.message.trim() : "";

  if (name.length === 0 || name.length > 120) {
    return { error: "Informe seu nome (até 120 caracteres)." };
  }
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  ) {
    return { error: "Informe um e-mail válido." };
  }
  if (companyName.length > 120) {
    return { error: "O nome da empresa deve ter até 120 caracteres." };
  }
  if (message.length === 0 || message.length > 5000) {
    return { error: "Escreva uma mensagem (até 5.000 caracteres)." };
  }

  return {
    value: {
      name,
      email,
      companyName: companyName.length > 0 ? companyName : null,
      message,
    },
  };
}

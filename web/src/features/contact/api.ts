type ContactRequest = {
  name: string;
  email: string;
  companyName: string;
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function submitContactRequest(request: ContactRequest): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error("Não foi possível conectar à plataforma. Tente novamente.");
  }

  if (response.ok) {
    return;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Não foi possível enviar sua mensagem. Tente novamente.");
  }

  if (isRecord(payload) && typeof payload.error === "string") {
    throw new Error(payload.error);
  }
  throw new Error("Não foi possível enviar sua mensagem. Tente novamente.");
}

type ContactRequest = {
  name: string;
  email: string;
  companyName: string;
  message: string;
};

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

  throw new Error(
    await readApiError(response, "Não foi possível enviar sua mensagem. Tente novamente."),
  );
}
import { readApiError } from "../../lib/api";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ValidationResult = { value: ChatMessage[] } | { error: string };
type ValueValidationResult<T> = { value: T } | { error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseChatSessionTitle(
  payload: unknown,
): ValueValidationResult<string> {
  if (!isRecord(payload) || typeof payload.title !== "string") {
    return { error: "Informe o título da conversa." };
  }
  const title = payload.title.trim();
  if (title.length === 0 || title.length > 80) {
    return { error: "O título deve ter entre 1 e 80 caracteres." };
  }
  return { value: title };
}

export function parseChatMessage(
  payload: unknown,
): ValueValidationResult<string> {
  if (!isRecord(payload) || typeof payload.content !== "string") {
    return { error: "Escreva uma mensagem antes de enviar." };
  }
  const content = payload.content.trim();
  if (content.length === 0 || content.length > 2000) {
    return { error: "A mensagem deve ter entre 1 e 2.000 caracteres." };
  }
  return { value: content };
}

export function parseChatMessages(payload: unknown): ValidationResult {
  if (!isRecord(payload)) {
    return { error: "Informe as mensagens da conversa." };
  }

  const messages = payload.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 24) {
    return { error: "A conversa deve conter entre 1 e 24 mensagens." };
  }

  const parsed: ChatMessage[] = [];
  let totalLength = 0;
  for (const message of messages) {
    if (!isRecord(message)) {
      return { error: "Há uma mensagem inválida na conversa." };
    }
    const item = message;
    if (
      (item.role !== "user" && item.role !== "assistant") ||
      typeof item.content !== "string" ||
      item.content.trim().length === 0 ||
      item.content.length > 2000
    ) {
      return { error: "As mensagens devem ter conteúdo válido de até 2.000 caracteres." };
    }
    totalLength += item.content.length;
    if (totalLength > 16_000) {
      return { error: "A conversa excede o limite de conteúdo permitido." };
    }
    parsed.push({ role: item.role, content: item.content.trim() });
  }

  if (parsed[parsed.length - 1]?.role !== "user") {
    return { error: "Envie uma mensagem para iniciar ou continuar a conversa." };
  }
  return { value: parsed };
}

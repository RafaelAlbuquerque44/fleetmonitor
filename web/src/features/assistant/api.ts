import { readApiError, redirectOnUnauthorized } from "../../lib/api";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatSession = {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatSessionDetails = ChatSession & {
  messages: (ChatMessage & { id: number; createdAt: string })[];
};

async function request(path: string, method = "GET", body?: unknown): Promise<unknown> {
  const response = await fetch(path, {
    method,
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    redirectOnUnauthorized(response);
    throw new Error(await readApiError(response, "Não foi possível concluir a operação."));
  }
  if (response.status === 204) return null;
  return response.json();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isChatSession(value: unknown): value is ChatSession {
  return isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.title === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string";
}

function isChatMessage(
  value: unknown,
): value is ChatSessionDetails["messages"][number] {
  return isRecord(value) &&
    typeof value.id === "number" &&
    (value.role === "user" || value.role === "assistant") &&
    typeof value.content === "string" &&
    typeof value.createdAt === "string";
}

export async function listChatSessions(): Promise<ChatSession[]> {
  const result = await request("/api/ai/sessions");
  if (!Array.isArray(result) || !result.every(isChatSession)) {
    throw new Error("A resposta do histórico de conversas está em um formato inválido.");
  }
  return result;
}

export async function getChatSession(id: number): Promise<ChatSessionDetails> {
  const result = await request(`/api/ai/sessions/${id}`);
  if (
    !isChatSession(result) ||
    !("messages" in result) ||
    !Array.isArray(result.messages) ||
    !result.messages.every(isChatMessage)
  ) {
    throw new Error("A conversa está em um formato inválido.");
  }
  return {
    id: result.id,
    title: result.title,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    messages: result.messages,
  };
}

export async function createChatSession(title: string): Promise<ChatSession> {
  const result = await request("/api/ai/sessions", "POST", { title });
  if (!isChatSession(result)) {
    throw new Error("A resposta ao criar a conversa está em um formato inválido.");
  }
  return result;
}

export async function sendChatMessage(id: number, content: string): Promise<string> {
  const result = await request(`/api/ai/sessions/${id}/messages`, "POST", { content });
  if (!isRecord(result) || typeof result.message !== "string") {
    throw new Error("A resposta da IA está em um formato inválido.");
  }
  return result.message;
}

export async function deleteChatSession(id: number): Promise<void> {
  await request(`/api/ai/sessions/${id}`, "DELETE");
}

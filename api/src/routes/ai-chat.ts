import { Hono } from "hono";
import {
  createUserChatSession,
  deleteUserChatSession,
  getUserChatContext,
  getUserChatSession,
  listUserChatSessions,
  saveUserChatExchange,
} from "../db/ai-chat";
import { requireAuthentication } from "../middleware/auth";
import type { AppEnvironment } from "../middleware/auth";
import { parseChatMessage, parseChatSessionTitle } from "./ai-chat.validation";

const routes = new Hono<AppEnvironment>();
const assistantInstruction =
  "Você é o assistente do FleetMonitor, uma plataforma de gestão de frotas. " +
  "Responda em português do Brasil, de forma prática e concisa. " +
  "Você não tem acesso aos registros da empresa; não invente dados operacionais.";

function parseSessionId(value: string) {
  const sessionId = Number(value);
  return Number.isSafeInteger(sessionId) && sessionId > 0 ? sessionId : null;
}

async function readJsonBody(request: Request) {
  try {
    return { body: await request.json() as unknown };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { error: "O corpo da requisição deve ser um JSON válido." };
    }
    throw error;
  }
}

routes.use("*", requireAuthentication);

routes.get("/sessions", async (c) => {
  const user = c.get("authenticatedUser");
  return c.json(await listUserChatSessions(user.companyId, user.id));
});

routes.post("/sessions", async (c) => {
  const parsedBody = await readJsonBody(c.req.raw);
  if ("error" in parsedBody) return c.json({ error: parsedBody.error }, 400);
  const parsed = parseChatSessionTitle(parsedBody.body);
  if ("error" in parsed) return c.json({ error: parsed.error }, 400);

  const user = c.get("authenticatedUser");
  const session = await createUserChatSession(
    user.companyId,
    user.id,
    parsed.value,
  );
  return c.json(session, 201);
});

routes.get("/sessions/:id", async (c) => {
  const sessionId = parseSessionId(c.req.param("id"));
  if (sessionId === null) return c.json({ error: "Conversa inválida." }, 400);

  const user = c.get("authenticatedUser");
  const session = await getUserChatSession(user.companyId, user.id, sessionId);
  if (!session) return c.json({ error: "Conversa não encontrada." }, 404);
  return c.json(session);
});

routes.delete("/sessions/:id", async (c) => {
  const sessionId = parseSessionId(c.req.param("id"));
  if (sessionId === null) return c.json({ error: "Conversa inválida." }, 400);

  const user = c.get("authenticatedUser");
  const deleted = await deleteUserChatSession(user.companyId, user.id, sessionId);
  if (!deleted) return c.json({ error: "Conversa não encontrada." }, 404);
  return c.json({ ok: true });
});

routes.post("/sessions/:id/messages", async (c) => {
  const sessionId = parseSessionId(c.req.param("id"));
  if (sessionId === null) return c.json({ error: "Conversa inválida." }, 400);

  const parsedBody = await readJsonBody(c.req.raw);
  if ("error" in parsedBody) return c.json({ error: parsedBody.error }, 400);
  const parsedMessage = parseChatMessage(parsedBody.body);
  if ("error" in parsedMessage) return c.json({ error: parsedMessage.error }, 400);

  const user = c.get("authenticatedUser");
  const history = await getUserChatContext(user.companyId, user.id, sessionId);
  if (!history) return c.json({ error: "Conversa não encontrada." }, 404);

  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "qwen2.5:3b";
  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        options: { num_predict: 512, temperature: 0.3 },
        messages: [
          { role: "system", content: assistantInstruction },
          ...history,
          { role: "user", content: parsedMessage.value },
        ],
      }),
      signal: AbortSignal.timeout(180_000),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return c.json(
      {
        error: timedOut
          ? "A IA demorou mais de 3 minutos para responder. Tente novamente."
          : "Não foi possível conectar à IA local. Verifique se o Ollama está em execução e se o modelo está disponível.",
      },
      timedOut ? 504 : 503,
    );
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const providerError =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : null;
    return c.json(
      {
        error: providerError?.includes("model")
          ? `O modelo "${model}" não está disponível no Ollama. Baixe-o e tente novamente.`
          : "A IA local recusou a solicitação. Tente novamente.",
      },
      502,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return c.json({ error: "A IA retornou uma resposta inválida." }, 502);
  }
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("message" in payload) ||
    typeof payload.message !== "object" ||
    payload.message === null ||
    !("content" in payload.message) ||
    typeof payload.message.content !== "string" ||
    payload.message.content.trim().length === 0
  ) {
    return c.json({ error: "A IA retornou uma resposta vazia ou inválida." }, 502);
  }

  const answer = payload.message.content.trim();
  const saved = await saveUserChatExchange(
    user.companyId,
    user.id,
    sessionId,
    parsedMessage.value,
    answer,
  );
  if (!saved) return c.json({ error: "Conversa não encontrada." }, 404);
  return c.json({ message: answer });
});

export default routes;

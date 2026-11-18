import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Icon } from "../components/Icon";
import { FleetAppShell } from "../features/navigation/FleetAppShell";
import {
  createChatSession,
  deleteChatSession,
  getChatSession,
  listChatSessions,
  sendChatMessage,
  type ChatMessage,
  type ChatSession,
} from "../features/assistant/api";

const suggestions = [
  "Como organizar a rotina de manutenção preventiva?",
  "Quais indicadores ajudam a reduzir o custo da frota?",
  "Como acompanhar o consumo de combustível?",
];

export function AssistantPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const refreshSessions = useCallback(async () => {
    const result = await listChatSessions();
    setSessions(result);
    return result;
  }, []);

  useEffect(() => {
    let active = true;
    async function loadHistory() {
      try {
        const result = await listChatSessions();
        if (active) setSessions(result);
      } catch (cause) {
        if (active) {
          setHistoryError(cause instanceof Error ? cause.message : "Não foi possível carregar o histórico.");
        }
      } finally {
        if (active) setLoadingHistory(false);
      }
    }
    void loadHistory();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [busy, messages]);

  async function openSession(session: ChatSession) {
    if (busy) return;
    setHistoryError(null);
    setError(null);
    setLoadingHistory(true);
    try {
      const details = await getChatSession(session.id);
      setSessionId(details.id);
      setMessages(details.messages.map(({ role, content }) => ({ role, content })));
    } catch (cause) {
      setHistoryError(cause instanceof Error ? cause.message : "Não foi possível abrir a conversa.");
    } finally {
      setLoadingHistory(false);
    }
  }

  function startNewChat() {
    if (busy) return;
    setSessionId(null);
    setMessages([]);
    setDraft("");
    setError(null);
  }

  async function removeSession(session: ChatSession) {
    if (busy || deletingId !== null) return;
    if (!window.confirm(`Excluir a conversa "${session.title}" e todas as mensagens?`)) return;
    setDeletingId(session.id);
    setHistoryError(null);
    try {
      await deleteChatSession(session.id);
      const remaining = sessions.filter((item) => item.id !== session.id);
      setSessions(remaining);
      if (sessionId === session.id) {
        setSessionId(null);
        setMessages([]);
        setError(null);
      }
    } catch (cause) {
      setHistoryError(cause instanceof Error ? cause.message : "Não foi possível excluir a conversa.");
    } finally {
      setDeletingId(null);
    }
  }

  async function submitMessage(text: string) {
    const content = text.trim();
    if (!content || busy) return;

    setMessages((current) => [...current, { role: "user", content }]);
    setDraft("");
    setError(null);
    setBusy(true);
    try {
      let activeSessionId = sessionId;
      if (activeSessionId === null) {
        const session = await createChatSession(content.slice(0, 80));
        activeSessionId = session.id;
        setSessionId(session.id);
        setSessions((current) => [session, ...current]);
      }
      const answer = await sendChatMessage(activeSessionId, content);
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
      await refreshSessions();
    } catch (cause) {
      setDraft(content);
      setError(cause instanceof Error ? cause.message : "Não foi possível obter uma resposta da IA.");
      try {
        await refreshSessions();
      } catch (refreshCause) {
        setHistoryError(
          refreshCause instanceof Error ? refreshCause.message : "Não foi possível atualizar o histórico.",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage(draft);
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage(draft);
    }
  }

  return (
    <FleetAppShell active="assistant" title="Assistente IA">
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#779b4d] dark:text-[#c4f36b]">
          ASSISTENTE DA FROTA
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Chat com IA</h1>
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={busy}
            onClick={startNewChat}
          >
            <Icon name="plus" className="size-4" />
            Nova conversa
          </Button>
        </div>
        <p className="mt-2 text-sm text-[#748078] dark:text-[#a7b2a9]">
          Tire dúvidas sobre a gestão de frotas. A IA usa o modelo local e não consulta
          automaticamente os registros da sua empresa.
        </p>

        <div className="mt-7 grid min-h-[34rem] gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside
            aria-label="Histórico de conversas"
            className="rounded-2xl border border-[#e5eae2] bg-white p-3 dark:border-fleet-border dark:bg-fleet-raised"
          >
            <h2 className="px-2 py-2 text-sm font-semibold">Histórico</h2>
            {historyError && (
              <p role="alert" className="m-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {historyError}
              </p>
            )}
            {loadingHistory ? (
              <p role="status" className="px-2 py-3 text-xs text-[#748078] dark:text-[#a7b2a9]">
                Carregando conversas...
              </p>
            ) : sessions.length === 0 ? (
              <p className="px-2 py-3 text-xs leading-5 text-[#748078] dark:text-[#a7b2a9]">
                Suas conversas ficam salvas aqui para você continuar depois.
              </p>
            ) : (
              <ul className="space-y-1">
                {sessions.map((session) => (
                  <li key={session.id} className="group flex items-start gap-1">
                    <button
                      type="button"
                      onClick={() => void openSession(session)}
                      disabled={busy || deletingId !== null}
                      aria-current={sessionId === session.id ? "page" : undefined}
                      className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-left text-xs leading-5 transition ${
                        sessionId === session.id
                          ? "bg-[#eeeeee] font-semibold text-[#526f37] dark:bg-fleet-highlight dark:text-[#c4f36b]"
                          : "text-[#526056] hover:bg-[#f3f3f3] dark:text-[#d9e1da] dark:hover:bg-fleet-surface"
                      }`}
                    >
                      <span className="block truncate">{session.title}</span>
                      <span className="mt-0.5 block text-[10px] font-normal text-[#879389]">
                        {new Date(session.updatedAt).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeSession(session)}
                      disabled={busy || deletingId !== null}
                      aria-label={`Excluir conversa ${session.title}`}
                      className="mt-1 rounded-md p-2 text-[#748078] hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                    >
                      {deletingId === session.id ? (
                        <span className="text-[10px]">...</span>
                      ) : (
                        <Icon name="trash" className="size-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <div className="flex min-h-[34rem] flex-col">
            <div
              className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-[#e5eae2] bg-white p-4 dark:border-fleet-border dark:bg-fleet-raised sm:p-6"
              aria-live="polite"
              aria-relevant="additions text"
              aria-busy={busy}
            >
              {messages.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-[#eeeeee] text-[#526f37] dark:bg-fleet-highlight dark:text-[#c4f36b]">
                    <Icon name="chat" className="size-6" />
                  </span>
                  <h2 className="mt-4 text-base font-semibold">Como posso ajudar?</h2>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => void submitMessage(suggestion)}
                        disabled={busy}
                        className="rounded-full border border-[#e5eae2] px-3 py-2 text-left text-xs text-[#526056] transition hover:bg-[#f3f3f3] disabled:opacity-50 dark:border-fleet-border dark:text-[#d9e1da] dark:hover:bg-fleet-highlight sm:text-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <article
                    key={`${index}-${message.role}`}
                    className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "ml-auto bg-[#eeeeee] text-[#17221c] dark:bg-fleet-highlight dark:text-[#eff4ef]"
                        : "bg-[#f5f5f5] text-[#17221c] dark:bg-fleet-surface dark:text-[#eff4ef]"
                    }`}
                  >
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#748078] dark:text-[#a7b2a9]">
                      {message.role === "user" ? "Você" : "Assistente"}
                    </p>
                    {message.content}
                  </article>
                ))
              )}
              {busy && (
                <p role="status" className="text-sm text-[#748078] dark:text-[#a7b2a9]">
                  A IA está pensando...
                </p>
              )}
              {error && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={onSubmit} className="mt-4 flex items-end gap-3">
              <label className="sr-only" htmlFor="assistant-message">Sua mensagem</label>
              <Textarea
                id="assistant-message"
                value={draft}
                maxLength={2000}
                rows={2}
                placeholder="Escreva sua pergunta... (Enter para enviar)"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onComposerKeyDown}
                disabled={busy}
                className="min-h-12 flex-1 resize-y rounded-xl border border-[#dfe5dd] bg-white px-4 py-3 text-sm text-[#17221c] dark:border-fleet-input-border dark:bg-fleet-input dark:text-[#eff4ef]"
              />
              <Button type="submit" disabled={busy || !draft.trim()} aria-label="Enviar mensagem">
                <Icon name="arrow" className="size-4" />
                <span className="hidden sm:inline">Enviar</span>
              </Button>
            </form>
          </div>
        </div>
      </section>
    </FleetAppShell>
  );
}

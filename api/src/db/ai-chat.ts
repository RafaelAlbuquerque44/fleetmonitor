import { and, desc, eq } from "drizzle-orm";
import { db } from "./index";
import { aiChatMessages, aiChatSessions } from "./schema";
import { withTenantTransaction } from "./tenant";

type ChatMessageDraft = {
  role: "user" | "assistant";
  content: string;
};

function isOwnedSession(companyId: number, userId: number, sessionId: number) {
  return and(
    eq(aiChatSessions.companyId, companyId),
    eq(aiChatSessions.userId, userId),
    eq(aiChatSessions.id, sessionId),
  );
}

export async function listUserChatSessions(companyId: number, userId: number) {
  return withTenantTransaction(companyId, (transaction) =>
    transaction
      .select({
        id: aiChatSessions.id,
        title: aiChatSessions.title,
        createdAt: aiChatSessions.createdAt,
        updatedAt: aiChatSessions.updatedAt,
      })
      .from(aiChatSessions)
      .where(and(
        eq(aiChatSessions.companyId, companyId),
        eq(aiChatSessions.userId, userId),
      ))
      .orderBy(desc(aiChatSessions.updatedAt), desc(aiChatSessions.id))
      .limit(50),
  );
}

export async function createUserChatSession(
  companyId: number,
  userId: number,
  title: string,
) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [session] = await transaction
      .insert(aiChatSessions)
      .values({ companyId, userId, title })
      .returning({
        id: aiChatSessions.id,
        title: aiChatSessions.title,
        createdAt: aiChatSessions.createdAt,
        updatedAt: aiChatSessions.updatedAt,
      });
    if (!session) throw new Error("Chat session insert returned no row");
    return session;
  });
}

export async function getUserChatSession(
  companyId: number,
  userId: number,
  sessionId: number,
) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [session] = await transaction
      .select({
        id: aiChatSessions.id,
        title: aiChatSessions.title,
        createdAt: aiChatSessions.createdAt,
        updatedAt: aiChatSessions.updatedAt,
      })
      .from(aiChatSessions)
      .where(isOwnedSession(companyId, userId, sessionId))
      .limit(1);
    if (!session) return null;

    const messages = await transaction
      .select({
        id: aiChatMessages.id,
        role: aiChatMessages.role,
        content: aiChatMessages.content,
        createdAt: aiChatMessages.createdAt,
      })
      .from(aiChatMessages)
      .where(and(
        eq(aiChatMessages.companyId, companyId),
        eq(aiChatMessages.sessionId, sessionId),
      ))
      .orderBy(aiChatMessages.createdAt, aiChatMessages.id)
      .limit(200);
    return { ...session, messages };
  });
}

export async function getUserChatContext(
  companyId: number,
  userId: number,
  sessionId: number,
) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [session] = await transaction
      .select({ id: aiChatSessions.id })
      .from(aiChatSessions)
      .where(isOwnedSession(companyId, userId, sessionId))
      .limit(1);
    if (!session) return null;

    return transaction
      .select({ role: aiChatMessages.role, content: aiChatMessages.content })
      .from(aiChatMessages)
      .where(and(
        eq(aiChatMessages.companyId, companyId),
        eq(aiChatMessages.sessionId, sessionId),
      ))
      .orderBy(desc(aiChatMessages.createdAt), desc(aiChatMessages.id))
      .limit(24);
  }).then((messages) => {
    if (messages === null) return null;
    return [...messages].reverse();
  });
}

export async function saveUserChatExchange(
  companyId: number,
  userId: number,
  sessionId: number,
  userContent: string,
  assistantContent: string,
) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [session] = await transaction
      .select({ id: aiChatSessions.id })
      .from(aiChatSessions)
      .where(isOwnedSession(companyId, userId, sessionId))
      .for("update")
      .limit(1);
    if (!session) return false;

    const now = new Date();
    const messages: ChatMessageDraft[] = [
      { role: "user", content: userContent },
      { role: "assistant", content: assistantContent },
    ];
    await transaction
      .insert(aiChatMessages)
      .values(messages.map((message) => ({
        companyId,
        sessionId,
        ...message,
        createdAt: now,
      })));
    await transaction
      .update(aiChatSessions)
      .set({ updatedAt: now })
      .where(isOwnedSession(companyId, userId, sessionId));
    return true;
  });
}

export async function deleteUserChatSession(
  companyId: number,
  userId: number,
  sessionId: number,
) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [deleted] = await transaction
      .delete(aiChatSessions)
      .where(isOwnedSession(companyId, userId, sessionId))
      .returning({ id: aiChatSessions.id });
    return deleted !== undefined;
  });
}

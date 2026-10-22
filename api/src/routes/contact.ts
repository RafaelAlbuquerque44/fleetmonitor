import { Hono } from "hono";
import { db } from "../db";
import { contactRequests } from "../db/schema";
import { parseContactRequest } from "./contact.validation";

const contactRoutes = new Hono();

contactRoutes.post("/", async (c) => {
  let body: unknown;

  try {
    body = await c.req.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return c.json({ error: "O corpo da requisição deve ser um JSON válido." }, 400);
    }
    throw error;
  }

  const parsed = parseContactRequest(body);
  if ("error" in parsed) {
    return c.json({ error: parsed.error }, 400);
  }

  const [request] = await db
    .insert(contactRequests)
    .values(parsed.value)
    .returning({ id: contactRequests.id });

  if (!request) {
    throw new Error("Contact request insert returned no row");
  }

  return c.json({ ok: true }, 201);
});

export default contactRoutes;

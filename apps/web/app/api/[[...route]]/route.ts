import { Hono } from "hono";
import { handle } from "hono/vercel";

// Rota catch-all única: a Vercel limita o número de funções, então toda a API
// vive aqui dentro (decisão de stack). O núcleo não sabe por qual canal a
// mensagem chegou — recebe contexto, devolve decisão.
export const runtime = "nodejs";

const app = new Hono().basePath("/api");

app.get("/health", (c) =>
  c.json({ ok: true, service: "cos", ts: new Date().toISOString() }),
);

export const GET = handle(app);
export const POST = handle(app);

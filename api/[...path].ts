import type { IncomingMessage, ServerResponse } from "node:http";
// Import the Fastify app factory from source. @vercel/node compiles the TS and
// traces its dependencies (fastify, @libsql/client, drizzle, etc.) into the
// serverless bundle.
import { buildServer } from "../apps/api/src/index.js";

// Build the Fastify instance once per warm serverless container and reuse it
// across invocations. `app.ready()` wires all routes/plugins before the first
// request is dispatched.
const app = buildServer();
const ready = app.ready();

/**
 * Vercel Node serverless entry point. Every request routed here by the
 * rewrites in vercel.json is handed to Fastify's underlying HTTP server, which
 * runs the matching route handler and writes the response.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  await ready;
  app.server.emit("request", req, res);
}

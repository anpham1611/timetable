import Fastify from "fastify";
import multipart from "@fastify/multipart";
import type { Db } from "./db/index.js";
import { healthRoutes } from "./routes/health.js";
import { visitRoutes } from "./routes/visit-counter.js";
import { timetableRoutes } from "./routes/timetable.js";
import { directoryRoutes } from "./routes/directory.js";
import { gridRoutes } from "./routes/grid.js";
import { adminRoutes } from "./routes/admin.js";

/**
 * Builds the Fastify server. An optional `db` is threaded into the admin
 * routes so tests can run writes against an isolated in-memory database;
 * production callers omit it and the admin routes use the default db.
 */
export function buildServer(opts: { db?: Db } = {}) {
  const app = Fastify({ logger: true });
  // 10 MB cap on uploaded workbooks (school files are small).
  app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
  app.register(healthRoutes);
  app.register(visitRoutes);
  app.register(timetableRoutes);
  app.register(directoryRoutes);
  app.register(gridRoutes);
  app.register(adminRoutes, { prefix: "/api/admin", db: opts.db });
  return app;
}

const PORT = Number(process.env.PORT ?? 3000);

// Only start listening when run directly (not when imported by tests).
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const app = buildServer();
  app
    .listen({ port: PORT, host: "0.0.0.0" })
    .then((address) => app.log.info(`api listening on ${address}`))
    .catch((err) => {
      app.log.error(err);
      process.exit(1);
    });
}

import Fastify from "fastify";
import { healthRoutes } from "./routes/health.js";

export function buildServer() {
  const app = Fastify({ logger: true });
  app.register(healthRoutes);
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

import { defineConfig } from "drizzle-kit";

const isTurso = (process.env.DB_ENGINE ?? "sqlite").toLowerCase() === "turso";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: isTurso ? "turso" : "sqlite",
  dbCredentials: isTurso
    ? {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        url: process.env.DATABASE_URL ?? "timetable.sqlite",
      },
});

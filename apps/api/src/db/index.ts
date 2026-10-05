import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient, type Config } from "@libsql/client";
import type { ResultSet } from "@libsql/client";
import type { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import * as schema from "./schema.js";

/**
 * Database engine selection.
 *
 * The same libSQL driver powers both paths, so application code never changes:
 *   - DB_ENGINE=sqlite (default) → local SQLite file via a `file:` URL.
 *     Great for local dev; data lives in a file on disk.
 *   - DB_ENGINE=turso → hosted libSQL (Turso) over HTTP. Required on serverless
 *     hosts like Vercel, where the filesystem is ephemeral/read-only.
 */
const DB_ENGINE = (process.env.DB_ENGINE ?? "sqlite").toLowerCase();

function resolveConfig(): Config {
  if (DB_ENGINE === "turso") {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      throw new Error(
        "DB_ENGINE=turso requires TURSO_DATABASE_URL (and usually TURSO_AUTH_TOKEN).",
      );
    }
    return { url, authToken: process.env.TURSO_AUTH_TOKEN };
  }

  // Local SQLite file. DATABASE_URL may be a bare path ("timetable.sqlite")
  // or an explicit libSQL file URL ("file:timetable.sqlite"); normalize both.
  const raw = process.env.DATABASE_URL ?? "timetable.sqlite";
  const url = raw.includes("://") ? raw : `file:${raw}`;
  return { url };
}

const client = createClient(resolveConfig());

/**
 * The libSQL-backed database type, shared across local (file) and Turso
 * (hosted) engines. libSQL is async, so every query returns a Promise and all
 * repository/service code awaits results.
 */
export type Db = LibSQLDatabase<typeof schema>;

/**
 * A libSQL transaction handle, as passed to the `db.transaction(async (tx) =>
 * ...)` callback. Structurally narrower than {@link Db} (it has no `batch`), so
 * repository functions that must accept either the top-level db or a transaction
 * take {@link DbOrTx}.
 */
export type Transaction = SQLiteTransaction<
  "async",
  ResultSet,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/** Either the top-level database or an open transaction. */
export type DbOrTx = Db | Transaction;

export const db: Db = drizzle(client, { schema });
export { schema };

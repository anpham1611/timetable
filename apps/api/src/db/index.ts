import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

const DB_FILE = process.env.DATABASE_URL ?? "timetable.sqlite";

const sqlite = new Database(DB_FILE);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
export { schema };

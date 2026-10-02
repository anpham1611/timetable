import { sql } from "drizzle-orm";
import { sqliteTable, integer } from "drizzle-orm/sqlite-core";

/**
 * Placeholder table so the Drizzle schema + migrations pipeline is wired.
 * Real timetable tables will replace/extend this.
 */
export const healthCheck = sqliteTable("health_check", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  checkedAt: integer("checked_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

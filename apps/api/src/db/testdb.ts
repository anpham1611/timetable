import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";
import type { Db } from "./index.js";

export type { Db };

/**
 * Creates an isolated in-memory database with the current schema applied,
 * for use in repository/service tests. Uses the same async libSQL driver as
 * production, so test and runtime behavior match. Mirrors the production table
 * shapes in `schema.ts`.
 */
export async function createTestDb(): Promise<Db> {
  const client = createClient({ url: ":memory:" });
  await client.executeMultiple(`
    CREATE TABLE visit_counter (
      id INTEGER PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ordinal INTEGER NOT NULL,
      effective_from INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE grade (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timetable_id INTEGER NOT NULL REFERENCES timetable(id),
      name TEXT NOT NULL
    );
    CREATE TABLE room (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timetable_id INTEGER NOT NULL REFERENCES timetable(id),
      name TEXT NOT NULL
    );
    CREATE TABLE class (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timetable_id INTEGER NOT NULL REFERENCES timetable(id),
      name TEXT NOT NULL,
      grade_id INTEGER NOT NULL REFERENCES grade(id),
      home_room_id INTEGER REFERENCES room(id)
    );
    CREATE TABLE student (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timetable_id INTEGER NOT NULL REFERENCES timetable(id),
      name TEXT NOT NULL,
      class_id INTEGER NOT NULL REFERENCES class(id)
    );
    CREATE TABLE teacher (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timetable_id INTEGER NOT NULL REFERENCES timetable(id),
      name TEXT NOT NULL,
      short_code TEXT
    );
    CREATE TABLE teacher_class (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL REFERENCES teacher(id),
      class_id INTEGER NOT NULL REFERENCES class(id)
    );
    CREATE TABLE subject (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timetable_id INTEGER NOT NULL REFERENCES timetable(id),
      name TEXT NOT NULL,
      short_code TEXT NOT NULL
    );
    CREATE TABLE period (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session TEXT NOT NULL,
      ordinal INTEGER NOT NULL,
      start_time TEXT,
      end_time TEXT
    );
    CREATE TABLE lesson (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timetable_id INTEGER NOT NULL REFERENCES timetable(id),
      class_id INTEGER NOT NULL REFERENCES class(id),
      period_id INTEGER NOT NULL REFERENCES period(id),
      day INTEGER NOT NULL,
      subject_id INTEGER NOT NULL REFERENCES subject(id),
      room_id INTEGER REFERENCES room(id),
      category INTEGER,
      choice_group TEXT
    );
    CREATE TABLE lesson_teacher (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL REFERENCES lesson(id),
      teacher_id INTEGER NOT NULL REFERENCES teacher(id)
    );
    CREATE TABLE student_lesson (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES student(id),
      lesson_id INTEGER NOT NULL REFERENCES lesson(id)
    );
  `);
  return drizzle(client, { schema });
}

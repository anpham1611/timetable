import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

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

/**
 * Single-row global visit counter. The one row (id=1) holds the running total
 * of home-page visits; increments are atomic `SET count = count + 1`.
 */
export const visitCounter = sqliteTable("visit_counter", {
  id: integer("id").primaryKey(),
  count: integer("count").notNull().default(0),
});

/**
 * Published timetable (TKB) record. Rows are listed on the home view while
 * active; the later Excel-import feature will populate these.
 */
export const timetable = sqliteTable("timetable", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ordinal: integer("ordinal").notNull(),
  effectiveFrom: integer("effective_from", { mode: "timestamp" }).notNull(),
  isActive: integer("is_active").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * School directory reference data. A grade (khối) owns many classes; a class
 * (lớp) belongs to exactly one grade and owns many students; a student belongs
 * to exactly one class. Teachers have their own identity and relate to many
 * classes through `teacher_class`.
 */
export const grade = sqliteTable("grade", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timetableId: integer("timetable_id")
    .notNull()
    .references(() => timetable.id),
  name: text("name").notNull(),
});

/** A physical room (phòng). A class has an optional home room. */
export const room = sqliteTable("room", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timetableId: integer("timetable_id")
    .notNull()
    .references(() => timetable.id),
  name: text("name").notNull(),
});

export const schoolClass = sqliteTable("class", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timetableId: integer("timetable_id")
    .notNull()
    .references(() => timetable.id),
  name: text("name").notNull(),
  gradeId: integer("grade_id")
    .notNull()
    .references(() => grade.id),
  homeRoomId: integer("home_room_id").references(() => room.id),
});

export const student = sqliteTable("student", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timetableId: integer("timetable_id")
    .notNull()
    .references(() => timetable.id),
  name: text("name").notNull(),
  classId: integer("class_id")
    .notNull()
    .references(() => schoolClass.id),
});

export const teacher = sqliteTable("teacher", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timetableId: integer("timetable_id")
    .notNull()
    .references(() => timetable.id),
  name: text("name").notNull(),
  shortCode: text("short_code"),
});

/** Join table: a teacher may teach many classes; a class may have many teachers. */
export const teacherClass = sqliteTable("teacher_class", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teacherId: integer("teacher_id")
    .notNull()
    .references(() => teacher.id),
  classId: integer("class_id")
    .notNull()
    .references(() => schoolClass.id),
});

/**
 * Schedule-grid structure and placements (recurring weekly pattern).
 *
 * A `period` is one of ten canonical slots: two sessions (SANG/CHIEU) × five
 * ordinals, with optional display times. A `lesson` places a subject into a
 * (class, day Thứ 2..7, period) slot, optionally in a room, with an optional
 * cell category and an optional elective choice-group label. Multiple lessons
 * may share the same (class, day, period) when they are electives students
 * split across. `lesson_teacher` carries multi-teacher cells; `student_lesson`
 * records which elective lesson a student attends.
 */
export const subject = sqliteTable("subject", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timetableId: integer("timetable_id")
    .notNull()
    .references(() => timetable.id),
  name: text("name").notNull(),
  shortCode: text("short_code").notNull(),
});

export const period = sqliteTable("period", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  session: text("session").notNull(), // 'SANG' | 'CHIEU'
  ordinal: integer("ordinal").notNull(), // 1..5
  startTime: text("start_time"),
  endTime: text("end_time"),
});

export const lesson = sqliteTable("lesson", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timetableId: integer("timetable_id")
    .notNull()
    .references(() => timetable.id),
  classId: integer("class_id")
    .notNull()
    .references(() => schoolClass.id),
  periodId: integer("period_id")
    .notNull()
    .references(() => period.id),
  day: integer("day").notNull(), // 2..7 (Thứ 2..Thứ 7)
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subject.id),
  roomId: integer("room_id").references(() => room.id),
  category: integer("category"),
  choiceGroup: text("choice_group"),
});

export const lessonTeacher = sqliteTable("lesson_teacher", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lessonId: integer("lesson_id")
    .notNull()
    .references(() => lesson.id),
  teacherId: integer("teacher_id")
    .notNull()
    .references(() => teacher.id),
});

export const studentLesson = sqliteTable("student_lesson", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => student.id),
  lessonId: integer("lesson_id")
    .notNull()
    .references(() => lesson.id),
});

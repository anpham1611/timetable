import { sql } from "drizzle-orm";
import { db } from "./index.js";
import {
  grade,
  lesson,
  lessonTeacher,
  period,
  room,
  schoolClass,
  student,
  studentLesson,
  subject,
  teacher,
  teacherClass,
  timetable,
  visitCounter,
} from "./schema.js";

/**
 * Idempotent seed: ensures the single visit_counter row exists, seeds two
 * active TKB rows for the home view, seeds the school directory (grades,
 * classes, students, teachers), and seeds a demonstration schedule grid
 * (periods, subjects, rooms, lessons, electives) so the class/student/teacher
 * grid views render. The later Excel-import feature will own real data; these
 * are placeholders.
 */
export async function seed(): Promise<void> {
  // Single global counter row (id=1). Keep existing count if already present.
  await db.insert(visitCounter)
    .values({ id: 1, count: 0 })
    .onConflictDoNothing()
    .run();

  // Seed two active TKBs only if none exist yet.
  const existingTkb = await db.get<{ n: number }>(
    sql`SELECT COUNT(*) as n FROM ${timetable}`
  );
  if (!existingTkb || existingTkb.n === 0) {
    await db.insert(timetable)
      .values([
        { ordinal: 1, effectiveFrom: new Date("2026-09-01T00:00:00Z"), isActive: 1 },
        { ordinal: 2, effectiveFrom: new Date("2026-09-15T00:00:00Z"), isActive: 1 },
      ])
      .run();
  }

  await seedPeriods();
  await seedDirectoryAndSchedule();
}

/** The ten canonical period rows. Afternoon period 1 has no configured time. */
async function seedPeriods(): Promise<void> {
  const existingPeriod = await db.get<{ n: number }>(
    sql`SELECT COUNT(*) as n FROM ${period}`
  );
  if (existingPeriod && existingPeriod.n > 0) return;

  await db.insert(period)
    .values([
      { session: "SANG", ordinal: 1, startTime: "07g00", endTime: "07g45" },
      { session: "SANG", ordinal: 2, startTime: "07g50", endTime: "08g35" },
      { session: "SANG", ordinal: 3, startTime: "09g05", endTime: "09g50" },
      { session: "SANG", ordinal: 4, startTime: "09g55", endTime: "10g40" },
      { session: "SANG", ordinal: 5, startTime: "10g45", endTime: "11g30" },
      { session: "CHIEU", ordinal: 1, startTime: null, endTime: null },
      { session: "CHIEU", ordinal: 2, startTime: "13g40", endTime: "14g25" },
      { session: "CHIEU", ordinal: 3, startTime: "14g30", endTime: "15g15" },
      { session: "CHIEU", ordinal: 4, startTime: "15g25", endTime: "16g10" },
      { session: "CHIEU", ordinal: 5, startTime: "16g15", endTime: "17g00" },
    ])
    .run();
}

async function seedDirectoryAndSchedule(): Promise<void> {
  // Seed the school directory + schedule only if empty.
  const existingGrade = await db.get<{ n: number }>(
    sql`SELECT COUNT(*) as n FROM ${grade}`
  );
  if (existingGrade && existingGrade.n > 0) return;

  // Resolve the seeded TKBs. The directory snapshot and demo schedule belong to
  // the default (latest active) TKB; the earlier TKB gets its own small snapshot
  // so lookups/grids scoped per TKB have distinct data to prove scoping.
  const tkbs = await db
    .select({ id: timetable.id, ordinal: timetable.ordinal })
    .from(timetable)
    .orderBy(timetable.ordinal)
    .all();
  const tkbEarly = tkbs[0]!.id; // ordinal 1 (older)
  const tkbDefault = (tkbs[1] ?? tkbs[0])!.id; // ordinal 2 (latest active = default)

  const [g10, g11, g12] = await db
    .insert(grade)
    .values([
      { name: "10", timetableId: tkbDefault },
      { name: "11", timetableId: tkbDefault },
      { name: "12", timetableId: tkbDefault },
    ])
    .returning({ id: grade.id })
    .all();

  // Rooms: home rooms plus a couple of elective destination rooms.
  const rooms = await db
    .insert(room)
    .values([
      { name: "10A4", timetableId: tkbDefault },
      { name: "11A5", timetableId: tkbDefault },
      { name: "11C3", timetableId: tkbDefault },
      { name: "11D1", timetableId: tkbDefault },
      { name: "11A2", timetableId: tkbDefault },
      { name: "12A5", timetableId: tkbDefault },
    ])
    .returning({ id: room.id, name: room.name })
    .all();
  const roomByName = new Map(rooms.map((r) => [r.name, r.id]));

  const classes = await db
    .insert(schoolClass)
    .values([
      { name: "10A4", gradeId: g10!.id, homeRoomId: roomByName.get("10A4")!, timetableId: tkbDefault },
      { name: "11A", gradeId: g11!.id, homeRoomId: null, timetableId: tkbDefault },
      { name: "11B", gradeId: g11!.id, homeRoomId: null, timetableId: tkbDefault },
      { name: "11C", gradeId: g11!.id, homeRoomId: null, timetableId: tkbDefault },
      { name: "11A5", gradeId: g11!.id, homeRoomId: roomByName.get("11A5")!, timetableId: tkbDefault },
      { name: "12A", gradeId: g12!.id, homeRoomId: null, timetableId: tkbDefault },
      { name: "12B", gradeId: g12!.id, homeRoomId: null, timetableId: tkbDefault },
      { name: "12A5", gradeId: g12!.id, homeRoomId: roomByName.get("12A5")!, timetableId: tkbDefault },
    ])
    .returning({ id: schoolClass.id, name: schoolClass.name })
    .all();
  const classByName = new Map(classes.map((c) => [c.name, c.id]));

  const students = await db
    .insert(student)
    .values([
      { name: "Nguyễn Văn An", classId: classByName.get("11A")!, timetableId: tkbDefault },
      { name: "Trần Thị Bình", classId: classByName.get("11A")!, timetableId: tkbDefault },
      { name: "Lê Văn Cường", classId: classByName.get("11B")!, timetableId: tkbDefault },
      { name: "Phạm Thị Dung", classId: classByName.get("11C")!, timetableId: tkbDefault },
      { name: "Hoàng Văn Em", classId: classByName.get("12A")!, timetableId: tkbDefault },
      { name: "Vũ Thị Giang", classId: classByName.get("12B")!, timetableId: tkbDefault },
      { name: "Cao Hoàng Vĩ", classId: classByName.get("11A5")!, timetableId: tkbDefault },
    ])
    .returning({ id: student.id, name: student.name })
    .all();
  const studentByName = new Map(students.map((s) => [s.name, s.id]));

  const teachers = await db
    .insert(teacher)
    .values([
      { name: "Đỗ Minh Hùng", shortCode: "Hùng.ĐM", timetableId: tkbDefault },
      { name: "Ngô Thị Lan", shortCode: "Lan.NT", timetableId: tkbDefault },
      { name: "Bùi Văn Khôi", shortCode: "Khôi.BV", timetableId: tkbDefault },
      // Teachers referenced by the demonstration grids.
      { name: "Nguyễn Văn Anh", shortCode: "Anh.NV", timetableId: tkbDefault },
      { name: "Phạm Vũ Như Quỳnh", shortCode: "Quỳnh.PVN", timetableId: tkbDefault },
      { name: "Nguyễn Hoàng Oanh", shortCode: "Oanh.NH", timetableId: tkbDefault },
      { name: "Huỳnh Đình Bảo Trinh", shortCode: "Trinh.HĐB", timetableId: tkbDefault },
      { name: "Đặng Thanh Thảo", shortCode: "Thảo.ĐT", timetableId: tkbDefault },
      { name: "Trần Hữu Trường", shortCode: "Trường.THS", timetableId: tkbDefault },
      { name: "Phạm Thị Hồng Nhung", shortCode: "Nhung.PTH", timetableId: tkbDefault },
      { name: "Hồ Minh Tâm", shortCode: "Tâm.HM", timetableId: tkbDefault },
      { name: "Nguyễn Hoài Mai", shortCode: "Mai.NH", timetableId: tkbDefault },
      { name: "Nguyễn Thị Cẩm Lý", shortCode: "Lý.NTC", timetableId: tkbDefault },
      { name: "Nguyễn Minh Trí", shortCode: "Trí.NM", timetableId: tkbDefault },
    ])
    .returning({ id: teacher.id, name: teacher.name })
    .all();
  const teacherByName = new Map(teachers.map((t) => [t.name, t.id]));
  const t = (name: string) => teacherByName.get(name)!;

  // Teacher → classes (directory relationship; keeps lookup search populated).
  await db.insert(teacherClass)
    .values([
      { teacherId: t("Đỗ Minh Hùng"), classId: classByName.get("11A")! },
      { teacherId: t("Đỗ Minh Hùng"), classId: classByName.get("11B")! },
      { teacherId: t("Đỗ Minh Hùng"), classId: classByName.get("12A")! },
      { teacherId: t("Ngô Thị Lan"), classId: classByName.get("11C")! },
      { teacherId: t("Bùi Văn Khôi"), classId: classByName.get("12B")! },
      { teacherId: t("Đặng Thanh Thảo"), classId: classByName.get("11A5")! },
      { teacherId: t("Đặng Thanh Thảo"), classId: classByName.get("12A5")! },
    ])
    .run();

  const subjects = await db
    .insert(subject)
    .values(
      [
        { name: "Toán", shortCode: "Toán" },
        { name: "Ngữ văn", shortCode: "Ngữ văn" },
        { name: "Tiếng Anh", shortCode: "Tiếng Anh" },
        { name: "Sinh học", shortCode: "Chuyên 1" },
        { name: "Sinh học", shortCode: "Chuyên 2" },
        { name: "Lịch sử", shortCode: "Lịch sử" },
        { name: "HĐTNHN", shortCode: "HĐTNHN" },
        { name: "SHĐT", shortCode: "SHĐT" },
        { name: "SHCN", shortCode: "SHCN" },
        { name: "GDĐP", shortCode: "GDĐP" },
        { name: "GDTC", shortCode: "GDTC" },
        { name: "QPAN", shortCode: "QPAN" },
        { name: "Công nghệ nông nghiệp", shortCode: "CNNN #2" },
        { name: "GDKTPL", shortCode: "GDKTPL #3" },
        { name: "Hóa học", shortCode: "Hóa học #6" },
        { name: "NN2-Pháp-Trung", shortCode: "NN2-Pháp-Trung" },
      ].map((sub) => ({ ...sub, timetableId: tkbDefault }))
    )
    .returning({ id: subject.id, shortCode: subject.shortCode })
    .all();
  // Subjects are addressed by shortCode in the demo (unique within this seed).
  const subjectByCode = new Map(subjects.map((s) => [s.shortCode, s.id]));
  const s = (code: string) => subjectByCode.get(code)!;

  // Periods addressed by (session, ordinal).
  const periodRows = await db
    .select({ id: period.id, session: period.session, ordinal: period.ordinal })
    .from(period)
    .all();
  const periodId = (session: string, ordinal: number) =>
    periodRows.find((p) => p.session === session && p.ordinal === ordinal)!.id;

  const class11A5 = classByName.get("11A5")!;
  const room11A5 = roomByName.get("11A5")!;

  /**
   * Insert one lesson and attach teachers (by name). Returns the lesson id so
   * electives can be linked to the student who attends them. Defaults to the
   * default/active TKB; pass `timetableId` to target another published TKB.
   */
  async function addLesson(opts: {
    classId: number;
    session: string;
    ordinal: number;
    day: number;
    subjectCode: string;
    roomName?: string;
    category?: number;
    choiceGroup?: string;
    teachers: string[];
    timetableId?: number;
  }): Promise<number> {
    const [row] = await db
      .insert(lesson)
      .values({
        timetableId: opts.timetableId ?? tkbDefault,
        classId: opts.classId,
        periodId: periodId(opts.session, opts.ordinal),
        day: opts.day,
        subjectId: s(opts.subjectCode),
        roomId: opts.roomName ? roomByName.get(opts.roomName)! : null,
        category: opts.category ?? null,
        choiceGroup: opts.choiceGroup ?? null,
      })
      .returning({ id: lesson.id })
      .all();
    const lessonId = row!.id;
    for (const name of opts.teachers) {
      await db.insert(lessonTeacher)
        .values({ lessonId, teacherId: t(name) })
        .run();
    }
    return lessonId;
  }

  // --- Demonstration schedule for class 11A5 (mirrors the student example). ---
  // Regular morning lessons (home room → not a room move).
  await addLesson({ classId: class11A5, session: "SANG", ordinal: 1, day: 2, subjectCode: "SHĐT", roomName: "11A5", teachers: ["Đặng Thanh Thảo"] });
  await addLesson({ classId: class11A5, session: "SANG", ordinal: 2, day: 2, subjectCode: "Tiếng Anh", roomName: "11A5", teachers: ["Phạm Thị Hồng Nhung"] });
  await addLesson({ classId: class11A5, session: "SANG", ordinal: 3, day: 2, subjectCode: "Chuyên 1", roomName: "11A5", teachers: ["Đặng Thanh Thảo"] });
  await addLesson({ classId: class11A5, session: "SANG", ordinal: 4, day: 2, subjectCode: "Chuyên 1", roomName: "11A5", teachers: ["Đặng Thanh Thảo"] });
  await addLesson({ classId: class11A5, session: "SANG", ordinal: 5, day: 2, subjectCode: "Chuyên 1", roomName: "11A5", teachers: ["Đặng Thanh Thảo"] });

  await addLesson({ classId: class11A5, session: "SANG", ordinal: 1, day: 3, subjectCode: "Lịch sử", roomName: "11A5", teachers: ["Trần Hữu Trường"] });
  await addLesson({ classId: class11A5, session: "SANG", ordinal: 2, day: 3, subjectCode: "Lịch sử", roomName: "11A5", teachers: ["Trần Hữu Trường"] });
  await addLesson({ classId: class11A5, session: "SANG", ordinal: 3, day: 3, subjectCode: "Ngữ văn", roomName: "11A5", teachers: ["Phạm Vũ Như Quỳnh"] });
  await addLesson({ classId: class11A5, session: "SANG", ordinal: 4, day: 3, subjectCode: "Ngữ văn", roomName: "11A5", teachers: ["Phạm Vũ Như Quỳnh"] });
  await addLesson({ classId: class11A5, session: "SANG", ordinal: 5, day: 3, subjectCode: "HĐTNHN", roomName: "11A5", teachers: ["Đặng Thanh Thảo"] });

  // Wednesday elective slot (TC2) — Cao Hoàng Vĩ attends CNNN #2 in room 11C3.
  const cnnn1 = await addLesson({ classId: class11A5, session: "SANG", ordinal: 1, day: 4, subjectCode: "CNNN #2", roomName: "11C3", category: 1, choiceGroup: "Tự chọn (TC2)", teachers: ["Nguyễn Thị Cẩm Lý"] });
  const cnnn2 = await addLesson({ classId: class11A5, session: "SANG", ordinal: 2, day: 4, subjectCode: "CNNN #2", roomName: "11C3", category: 1, choiceGroup: "Tự chọn (TC2)", teachers: ["Nguyễn Thị Cẩm Lý"] });
  await addLesson({ classId: class11A5, session: "SANG", ordinal: 3, day: 4, subjectCode: "Toán", roomName: "11A5", teachers: ["Trần Hữu Trường"] });
  await addLesson({ classId: class11A5, session: "SANG", ordinal: 4, day: 4, subjectCode: "Tiếng Anh", roomName: "11A5", teachers: ["Phạm Thị Hồng Nhung"] });
  await addLesson({ classId: class11A5, session: "SANG", ordinal: 5, day: 4, subjectCode: "Tiếng Anh", roomName: "11A5", teachers: ["Phạm Thị Hồng Nhung"] });

  // Wednesday afternoon elective (TC4) — Chuyên 2 taught in the home room.
  const chuyen2a = await addLesson({ classId: class11A5, session: "CHIEU", ordinal: 2, day: 4, subjectCode: "Chuyên 2", roomName: "11A5", category: 4, choiceGroup: "Tự chọn (TC4)", teachers: ["Đặng Thanh Thảo"] });
  const chuyen2b = await addLesson({ classId: class11A5, session: "CHIEU", ordinal: 3, day: 4, subjectCode: "Chuyên 2", roomName: "11A5", category: 4, choiceGroup: "Tự chọn (TC4)", teachers: ["Đặng Thanh Thảo"] });

  // Thursday elective slot (TC3) — Hóa học #6 in room 11A2.
  const hoa1 = await addLesson({ classId: class11A5, session: "SANG", ordinal: 3, day: 5, subjectCode: "Hóa học #6", roomName: "11A2", category: 3, choiceGroup: "Tự chọn (TC3)", teachers: ["Nguyễn Hoàng Oanh"] });
  const hoa2 = await addLesson({ classId: class11A5, session: "SANG", ordinal: 4, day: 5, subjectCode: "Hóa học #6", roomName: "11A2", category: 3, choiceGroup: "Tự chọn (TC3)", teachers: ["Nguyễn Hoàng Oanh"] });

  // Friday afternoon multi-teacher elective (Ngoại ngữ 2).
  const nn2a = await addLesson({ classId: class11A5, session: "CHIEU", ordinal: 2, day: 6, subjectCode: "NN2-Pháp-Trung", roomName: "11A5", category: 2, choiceGroup: "Ngoại ngữ 2", teachers: ["Hồ Minh Tâm", "Nguyễn Hoài Mai"] });
  const nn2b = await addLesson({ classId: class11A5, session: "CHIEU", ordinal: 3, day: 6, subjectCode: "NN2-Pháp-Trung", roomName: "11A5", category: 2, choiceGroup: "Ngoại ngữ 2", teachers: ["Hồ Minh Tâm", "Nguyễn Hoài Mai"] });

  // Saturday morning.
  await addLesson({ classId: class11A5, session: "SANG", ordinal: 1, day: 7, subjectCode: "GDĐP", roomName: "11A5", teachers: ["Nguyễn Hoàng Oanh"] });
  await addLesson({ classId: class11A5, session: "SANG", ordinal: 5, day: 7, subjectCode: "SHCN", roomName: "11A5", teachers: ["Đặng Thanh Thảo"] });

  // --- Đặng Thanh Thảo also teaches class 12A5 (cross-class teacher grid). ---
  const class12A5 = classByName.get("12A5")!;
  await addLesson({ classId: class12A5, session: "CHIEU", ordinal: 3, day: 2, subjectCode: "Chuyên 1", roomName: "12A5", teachers: ["Đặng Thanh Thảo"] });
  await addLesson({ classId: class12A5, session: "CHIEU", ordinal: 4, day: 2, subjectCode: "Chuyên 1", roomName: "12A5", teachers: ["Đặng Thanh Thảo"] });
  await addLesson({ classId: class12A5, session: "CHIEU", ordinal: 5, day: 2, subjectCode: "Chuyên 1", roomName: "12A5", teachers: ["Đặng Thanh Thảo"] });

  // --- Enroll Cao Hoàng Vĩ in his elective lessons. ---
  const vi = studentByName.get("Cao Hoàng Vĩ")!;
  for (const lessonId of [cnnn1, cnnn2, chuyen2a, chuyen2b, hoa1, hoa2, nn2a, nn2b]) {
    await db.insert(studentLesson).values({ studentId: vi, lessonId }).run();
  }

  // --- A deliberately different, self-contained snapshot for the earlier TKB,
  // to prove directory + lessons are scoped per published timetable. The earlier
  // TKB owns its own grade/room/class/teacher/subject (same codes, distinct rows). ---
  const [eGrade] = await db
    .insert(grade)
    .values([{ name: "11", timetableId: tkbEarly }])
    .returning({ id: grade.id })
    .all();
  const [eRoom] = await db
    .insert(room)
    .values([{ name: "11A5", timetableId: tkbEarly }])
    .returning({ id: room.id })
    .all();
  const [eClass] = await db
    .insert(schoolClass)
    .values([
      { name: "11A5", gradeId: eGrade!.id, homeRoomId: eRoom!.id, timetableId: tkbEarly },
    ])
    .returning({ id: schoolClass.id })
    .all();
  const eTeachers = await db
    .insert(teacher)
    .values([
      { name: "Trần Hữu Trường", shortCode: "Trường.THS", timetableId: tkbEarly },
      { name: "Phạm Vũ Như Quỳnh", shortCode: "Quỳnh.PVN", timetableId: tkbEarly },
    ])
    .returning({ id: teacher.id, name: teacher.name })
    .all();
  const eTeacherByName = new Map(eTeachers.map((x) => [x.name, x.id]));
  const eSubjects = await db
    .insert(subject)
    .values([
      { name: "Toán", shortCode: "Toán", timetableId: tkbEarly },
      { name: "Ngữ văn", shortCode: "Ngữ văn", timetableId: tkbEarly },
    ])
    .returning({ id: subject.id, shortCode: subject.shortCode })
    .all();
  const eSubjectByCode = new Map(eSubjects.map((x) => [x.shortCode, x.id]));

  async function addEarlyLesson(opts: {
    session: string;
    ordinal: number;
    day: number;
    subjectCode: string;
    teacher: string;
  }): Promise<void> {
    const [row] = await db
      .insert(lesson)
      .values({
        timetableId: tkbEarly,
        classId: eClass!.id,
        periodId: periodId(opts.session, opts.ordinal),
        day: opts.day,
        subjectId: eSubjectByCode.get(opts.subjectCode)!,
        roomId: eRoom!.id,
        category: null,
        choiceGroup: null,
      })
      .returning({ id: lesson.id })
      .all();
    await db.insert(lessonTeacher)
      .values({ lessonId: row!.id, teacherId: eTeacherByName.get(opts.teacher)! })
      .run();
  }

  await addEarlyLesson({ session: "SANG", ordinal: 1, day: 2, subjectCode: "Toán", teacher: "Trần Hữu Trường" });
  await addEarlyLesson({ session: "SANG", ordinal: 2, day: 2, subjectCode: "Ngữ văn", teacher: "Phạm Vũ Như Quỳnh" });

  // Silence unused-var lint for room reference kept for clarity.
  void room11A5;
}

// Allow running directly: `tsx src/db/seed.ts`.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => console.log("Seed complete."))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

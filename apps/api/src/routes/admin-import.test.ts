import ExcelJS from "exceljs";
import { afterEach, describe, expect, it } from "vitest";
import { importResultSchema, importErrorResponseSchema } from "@timetable/shared";
import { buildServer } from "../index.js";
import { clearSessions } from "../middleware/session.js";
import { createTestDb } from "../db/testdb.js";
import { lesson, timetable } from "../db/schema.js";
import {
  CLASS_COLUMNS,
  CLASS_SHEET,
  GRADE_COLUMNS,
  GRADE_SHEET,
  LESSON_COLUMNS,
  LESSON_SHEET,
  META_EFFECTIVE_FROM_KEY,
  META_SHEET,
  STUDENT_COLUMNS,
  STUDENT_SHEET,
  TEACHER_COLUMNS,
  TEACHER_SHEET,
} from "../services/import-format.js";

const ORIGINAL_USER = process.env.ADMIN_USERNAME;
const ORIGINAL_PASS = process.env.ADMIN_PASSWORD;
const BOUNDARY = "----timetabletest";

function setCreds() {
  process.env.ADMIN_USERNAME = "admin";
  process.env.ADMIN_PASSWORD = "s3cret";
}

/** Log in against a built server and return a Bearer auth header. */
async function login(
  app: ReturnType<typeof buildServer>
): Promise<Record<string, string>> {
  const res = await app.inject({
    method: "POST",
    url: "/api/admin/login",
    payload: { username: "admin", password: "s3cret" },
  });
  const { token } = res.json() as { token: string };
  return { authorization: `Bearer ${token}` };
}

afterEach(() => {
  clearSessions();
  if (ORIGINAL_USER === undefined) delete process.env.ADMIN_USERNAME;
  else process.env.ADMIN_USERNAME = ORIGINAL_USER;
  if (ORIGINAL_PASS === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = ORIGINAL_PASS;
});

type Row = (string | number)[];

/** Build a complete, valid six-sheet workbook with the given lesson rows. */
async function filledWorkbook(lessons: Row[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const meta = wb.addWorksheet(META_SHEET);
  meta.addRow(["key", "value"]);
  meta.addRow([META_EFFECTIVE_FROM_KEY, "2026-09-07"]);

  const g = wb.addWorksheet(GRADE_SHEET);
  g.addRow([...GRADE_COLUMNS]);
  g.addRow(["11", "Khối 11"]);

  const c = wb.addWorksheet(CLASS_SHEET);
  c.addRow([...CLASS_COLUMNS]);
  c.addRow(["11A5", "11A5", "11", "P.201"]);

  const t = wb.addWorksheet(TEACHER_SHEET);
  t.addRow([...TEACHER_COLUMNS]);
  t.addRow(["NVA", "Nguyễn Văn A"]);
  t.addRow(["NVB", "Nguyễn Văn B"]);

  const s = wb.addWorksheet(STUDENT_SHEET);
  s.addRow([...STUDENT_COLUMNS]);
  s.addRow(["HS1", "Trần Thị B", "11A5"]);

  const l = wb.addWorksheet(LESSON_SHEET);
  l.addRow([...LESSON_COLUMNS]);
  for (const r of lessons) l.addRow(r);

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** Build a minimal multipart/form-data body with one file field named "file". */
function multipartBody(filename: string, content: Buffer): Buffer {
  const head = Buffer.from(
    `--${BOUNDARY}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`,
    "utf8"
  );
  const tail = Buffer.from(`\r\n--${BOUNDARY}--\r\n`, "utf8");
  return Buffer.concat([head, content, tail]);
}

const rowA: Row = ["11A5", 2, "SANG", 1, "Toán", "TOAN", "NVA,NVB", "P.202", ""];

describe("POST /admin/import", () => {
  async function post(
    app: ReturnType<typeof buildServer>,
    auth: Record<string, string>,
    body: Buffer
  ) {
    return app.inject({
      method: "POST",
      url: "/api/admin/import",
      headers: {
        ...auth,
        "content-type": `multipart/form-data; boundary=${BOUNDARY}`,
      },
      payload: body,
    });
  }

  it("imports a filled template as a new inactive TKB", async () => {
    setCreds();
    const db = createTestDb();
    const app = buildServer({ db });
    const auth = await login(app);
    const file = await filledWorkbook([rowA]);

    const res = await post(app, auth, multipartBody("tkb.xlsx", file));
    expect(res.statusCode).toBe(201);
    const result = importResultSchema.parse(res.json());
    expect(result.lessonsCreated).toBe(1);

    const tkb = db
      .select()
      .from(timetable)
      .all()
      .find((t) => t.id === result.timetableId)!;
    expect(tkb.isActive).toBe(0);
    expect(db.select().from(lesson).all()).toHaveLength(1);
    await app.close();
  });

  it("creates a distinct TKB on a second import", async () => {
    setCreds();
    const db = createTestDb();
    const app = buildServer({ db });
    const auth = await login(app);
    const file = await filledWorkbook([rowA]);

    const first = importResultSchema.parse(
      (await post(app, auth, multipartBody("a.xlsx", file))).json()
    );
    const second = importResultSchema.parse(
      (await post(app, auth, multipartBody("b.xlsx", file))).json()
    );
    expect(second.timetableId).not.toBe(first.timetableId);
    expect(db.select().from(timetable).all()).toHaveLength(2);
    await app.close();
  });

  it("rejects an invalid workbook with 400 and creates nothing", async () => {
    setCreds();
    const db = createTestDb();
    const app = buildServer({ db });
    const auth = await login(app);

    const res = await post(
      app,
      auth,
      multipartBody("bad.xlsx", Buffer.from("not xlsx"))
    );
    expect(res.statusCode).toBe(400);
    // Body carries a located error { error: { sheet, message, ... } }.
    const body = importErrorResponseSchema.parse(res.json());
    expect(body.error.message).toMatch(/workbook/i);
    expect(db.select().from(timetable).all()).toHaveLength(0);
    await app.close();
  });

  it("returns a located error for a referential problem", async () => {
    setCreds();
    const db = createTestDb();
    const app = buildServer({ db });
    const auth = await login(app);
    // Lesson references a teacher code that the Teacher sheet does not declare.
    const file = await filledWorkbook([
      ["11A5", 2, "SANG", 1, "Toán", "TOAN", "ZZZ", "P.202", ""],
    ]);
    const res = await post(app, auth, multipartBody("bad.xlsx", file));
    expect(res.statusCode).toBe(400);
    const body = importErrorResponseSchema.parse(res.json());
    expect(body.error.sheet).toBe(LESSON_SHEET);
    expect(body.error.column).toBe("teacherCodes");
    expect(db.select().from(timetable).all()).toHaveLength(0);
    await app.close();
  });

  it("is gated by a valid admin session", async () => {
    setCreds();
    const db = createTestDb();
    const app = buildServer({ db });
    const file = await filledWorkbook([rowA]);
    const res = await app.inject({
      method: "POST",
      url: "/api/admin/import",
      headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
      payload: multipartBody("tkb.xlsx", file),
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });
});

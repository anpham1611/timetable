import { describe, expect, it } from "vitest";
import {
  classListResponseSchema,
  studentSearchResponseSchema,
  teacherSearchResponseSchema,
  weekGridSchema,
} from "@timetable/shared";
import { buildServer } from "../index.js";

/** Resolve a seeded class id by name via the directory endpoint. */
async function classIdByName(app: ReturnType<typeof buildServer>, name: string) {
  const res = await app.inject({ method: "GET", url: "/classes" });
  const body = classListResponseSchema.parse(res.json());
  return body.items.find((c) => c.name === name)?.id;
}

describe("grid routes", () => {
  it("GET /grids/class/:id returns a resolved class grid", async () => {
    const app = buildServer();
    const id = await classIdByName(app, "11A5");
    expect(id).toBeDefined();
    const res = await app.inject({ method: "GET", url: `/grids/class/${id}` });
    expect(res.statusCode).toBe(200);
    const grid = weekGridSchema.parse(res.json());
    expect(grid.title).toBe("Lớp 11A5");
    expect(grid.days).toEqual([2, 3, 4, 5, 6, 7]);
    expect(grid.slots.some((s) => s.cell !== null)).toBe(true);
    await app.close();
  });

  it("GET /grids/student/:id returns a resolved student grid with class subtitle", async () => {
    const app = buildServer();
    const search = await app.inject({ method: "GET", url: "/students?q=Cao Hoàng Vĩ" });
    const student = studentSearchResponseSchema.parse(search.json()).items[0];
    expect(student).toBeDefined();
    const res = await app.inject({ method: "GET", url: `/grids/student/${student!.id}` });
    expect(res.statusCode).toBe(200);
    const grid = weekGridSchema.parse(res.json());
    expect(grid.title).toBe("Cao Hoàng Vĩ");
    expect(grid.subtitle).toContain("Lớp");
    await app.close();
  });

  it("GET /grids/teacher/:id returns a resolved teacher grid", async () => {
    const app = buildServer();
    const search = await app.inject({ method: "GET", url: "/teachers?q=Thảo" });
    const t = teacherSearchResponseSchema.parse(search.json()).items.find((x) =>
      x.name.includes("Đặng Thanh Thảo")
    );
    expect(t).toBeDefined();
    const res = await app.inject({ method: "GET", url: `/grids/teacher/${t!.id}` });
    expect(res.statusCode).toBe(200);
    const grid = weekGridSchema.parse(res.json());
    expect(grid.title).toContain("Đặng Thanh Thảo");
    expect(grid.slots.some((s) => s.cell?.className != null)).toBe(true);
    await app.close();
  });

  it("returns 404 for unknown class/student/teacher ids", async () => {
    const app = buildServer();
    for (const kind of ["class", "student", "teacher"]) {
      const res = await app.inject({ method: "GET", url: `/grids/${kind}/999999` });
      expect(res.statusCode).toBe(404);
    }
    await app.close();
  });

  it("honours an explicit ?tkb= and 404s for an unknown TKB", async () => {
    const app = buildServer();
    const id = await classIdByName(app, "11A5");
    // The seed assigns the demo schedule to the latest (default) TKB; request it
    // explicitly and confirm the grid echoes that timetable id.
    const active = await app.inject({ method: "GET", url: "/timetables/active" });
    const { defaultSelectedId } = active.json() as { defaultSelectedId: number };
    const res = await app.inject({
      method: "GET",
      url: `/grids/class/${id}?tkb=${defaultSelectedId}`,
    });
    expect(res.statusCode).toBe(200);
    const grid = weekGridSchema.parse(res.json());
    expect(grid.timetableId).toBe(defaultSelectedId);

    const bad = await app.inject({ method: "GET", url: `/grids/class/${id}?tkb=999999` });
    expect(bad.statusCode).toBe(404);
    await app.close();
  });
});

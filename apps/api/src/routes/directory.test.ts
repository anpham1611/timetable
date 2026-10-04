import { describe, expect, it } from "vitest";
import {
  classListResponseSchema,
  studentSearchResponseSchema,
  teacherSearchResponseSchema,
} from "@timetable/shared";
import { buildServer } from "../index.js";

describe("directory routes", () => {
  it("GET /classes returns the seeded classes with grades", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/classes" });
    expect(res.statusCode).toBe(200);
    const body = classListResponseSchema.parse(res.json());
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    expect(body.items[0]!.grade.name).toBeTruthy();
    await app.close();
  });

  it("GET /students?q= returns matching students", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/students?q=nguyễn" });
    expect(res.statusCode).toBe(200);
    const body = studentSearchResponseSchema.parse(res.json());
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    await app.close();
  });

  it("GET /students with an empty query returns an empty list", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/students?q=" });
    expect(res.statusCode).toBe(200);
    expect(studentSearchResponseSchema.parse(res.json())).toEqual({ items: [] });
    await app.close();
  });

  it("GET /teachers?q= returns matching teachers", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/teachers?q=Minh" });
    expect(res.statusCode).toBe(200);
    const body = teacherSearchResponseSchema.parse(res.json());
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    await app.close();
  });

  it("GET /teachers with no query returns an empty list", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/teachers" });
    expect(res.statusCode).toBe(200);
    expect(teacherSearchResponseSchema.parse(res.json())).toEqual({ items: [] });
    await app.close();
  });
});

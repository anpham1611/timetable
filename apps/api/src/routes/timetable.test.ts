import { describe, expect, it } from "vitest";
import { activeTimetablesResponseSchema } from "@timetable/shared";
import { buildServer } from "../index.js";

describe("GET /timetables/active", () => {
  it("returns the seeded active items and a default-selected id", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/timetables/active" });
    expect(res.statusCode).toBe(200);

    const body = activeTimetablesResponseSchema.parse(res.json());
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    // defaultSelectedId must reference one of the returned items.
    expect(body.items.some((i) => i.id === body.defaultSelectedId)).toBe(true);
    await app.close();
  });
});

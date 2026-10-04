import { describe, expect, it } from "vitest";
import { visitCountResponseSchema } from "@timetable/shared";
import { buildServer } from "../index.js";

describe("POST /visits", () => {
  it("increments the visit count by 2 over two posts", async () => {
    const app = buildServer();

    const res1 = await app.inject({ method: "POST", url: "/visits" });
    expect(res1.statusCode).toBe(200);
    const first = visitCountResponseSchema.parse(res1.json());

    const res2 = await app.inject({ method: "POST", url: "/visits" });
    const second = visitCountResponseSchema.parse(res2.json());

    expect(second.count - first.count).toBe(1);
    await app.close();
  });
});

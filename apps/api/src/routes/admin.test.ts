import { afterEach, describe, expect, it } from "vitest";
import { adminTimetableListResponseSchema } from "@timetable/shared";
import { buildServer } from "../index.js";
import { clearSessions } from "../middleware/session.js";
import { timetable } from "../db/schema.js";
import { createTestDb } from "../db/testdb.js";

const ORIGINAL_USER = process.env.ADMIN_USERNAME;
const ORIGINAL_PASS = process.env.ADMIN_PASSWORD;

function setCreds() {
  process.env.ADMIN_USERNAME = "admin";
  process.env.ADMIN_PASSWORD = "s3cret";
}

/** Log in against a built server and return a Bearer auth header. */
async function login(
  app: ReturnType<typeof buildServer>,
  username = "admin",
  password = "s3cret"
): Promise<Record<string, string>> {
  const res = await app.inject({
    method: "POST",
    url: "/api/admin/login",
    payload: { username, password },
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

describe("admin login", () => {
  it("issues a token for correct credentials", async () => {
    setCreds();
    const app = buildServer();
    const res = await app.inject({
      method: "POST",
      url: "/api/admin/login",
      payload: { username: "admin", password: "s3cret" },
    });
    expect(res.statusCode).toBe(200);
    expect((res.json() as { token: string }).token).toBeTruthy();
    await app.close();
  });

  it("rejects wrong credentials with 401", async () => {
    setCreds();
    const app = buildServer();
    const res = await app.inject({
      method: "POST",
      url: "/api/admin/login",
      payload: { username: "admin", password: "nope" },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("rejects login when credentials are unconfigured", async () => {
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    const app = buildServer();
    const res = await app.inject({
      method: "POST",
      url: "/api/admin/login",
      payload: { username: "admin", password: "s3cret" },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("rejects a malformed login body with 400", async () => {
    setCreds();
    const app = buildServer();
    const res = await app.inject({
      method: "POST",
      url: "/api/admin/login",
      payload: { username: "admin" },
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });
});

describe("admin route gate", () => {
  it("allows a request carrying a valid session token", async () => {
    setCreds();
    const app = buildServer();
    const auth = await login(app);
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/timetables",
      headers: auth,
    });
    expect(res.statusCode).toBe(200);
    expect(() => adminTimetableListResponseSchema.parse(res.json())).not.toThrow();
    await app.close();
  });

  it("rejects a request with an invalid token", async () => {
    setCreds();
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/timetables",
      headers: { authorization: "Bearer not-a-real-session" },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("rejects a request with no authorization header", async () => {
    setCreds();
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/admin/timetables" });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("rejects every admin request when credentials are unconfigured", async () => {
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/timetables",
      headers: { authorization: "Bearer anything" },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });
});

describe("admin logout", () => {
  it("invalidates the session so later requests are rejected", async () => {
    setCreds();
    const app = buildServer();
    const auth = await login(app);

    const ok = await app.inject({
      method: "GET",
      url: "/api/admin/timetables",
      headers: auth,
    });
    expect(ok.statusCode).toBe(200);

    const out = await app.inject({
      method: "POST",
      url: "/api/admin/logout",
      headers: auth,
    });
    expect(out.statusCode).toBe(204);

    const after = await app.inject({
      method: "GET",
      url: "/api/admin/timetables",
      headers: auth,
    });
    expect(after.statusCode).toBe(401);
    await app.close();
  });
});

describe("admin timetable list + toggle", () => {
  function seededApp() {
    setCreds();
    const db = createTestDb();
    db.insert(timetable)
      .values([
        { ordinal: 1, effectiveFrom: new Date("2026-09-01T00:00:00Z"), isActive: 1 },
        { ordinal: 2, effectiveFrom: new Date("2026-09-15T00:00:00Z"), isActive: 0 },
      ])
      .run();
    return buildServer({ db });
  }

  it("lists active and inactive TKBs", async () => {
    const app = seededApp();
    const auth = await login(app);
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/timetables",
      headers: auth,
    });
    const body = adminTimetableListResponseSchema.parse(res.json());
    expect(body.items.map((i) => i.isActive)).toEqual([true, false]);
    await app.close();
  });

  it("toggles a TKB's active state", async () => {
    const app = seededApp();
    const auth = await login(app);
    const res = await app.inject({
      method: "PATCH",
      url: "/api/admin/timetables/2/active",
      headers: auth,
      payload: { isActive: true },
    });
    expect(res.statusCode).toBe(200);

    const list = await app.inject({
      method: "GET",
      url: "/api/admin/timetables",
      headers: auth,
    });
    const body = adminTimetableListResponseSchema.parse(list.json());
    expect(body.items.find((i) => i.id === 2)!.isActive).toBe(true);
    await app.close();
  });

  it("returns 404 when toggling an unknown TKB", async () => {
    const app = seededApp();
    const auth = await login(app);
    const res = await app.inject({
      method: "PATCH",
      url: "/api/admin/timetables/999/active",
      headers: auth,
      payload: { isActive: false },
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it("rejects an invalid toggle body with 400", async () => {
    const app = seededApp();
    const auth = await login(app);
    const res = await app.inject({
      method: "PATCH",
      url: "/api/admin/timetables/1/active",
      headers: auth,
      payload: { isActive: "yes" },
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });
});

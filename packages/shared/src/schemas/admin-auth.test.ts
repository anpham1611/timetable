import { describe, expect, it } from "vitest";
import { loginRequestSchema, loginResponseSchema } from "./admin-auth.js";

describe("loginRequestSchema", () => {
  it("accepts a username and password", () => {
    expect(
      loginRequestSchema.parse({ username: "admin", password: "pw" })
    ).toEqual({ username: "admin", password: "pw" });
  });

  it("rejects an empty username", () => {
    expect(
      loginRequestSchema.safeParse({ username: "", password: "pw" }).success
    ).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(
      loginRequestSchema.safeParse({ username: "admin", password: "" }).success
    ).toBe(false);
  });

  it("rejects a missing field", () => {
    expect(loginRequestSchema.safeParse({ username: "admin" }).success).toBe(
      false
    );
  });
});

describe("loginResponseSchema", () => {
  it("accepts a non-empty token", () => {
    expect(loginResponseSchema.parse({ token: "abc" })).toEqual({
      token: "abc",
    });
  });

  it("rejects an empty token", () => {
    expect(loginResponseSchema.safeParse({ token: "" }).success).toBe(false);
  });
});

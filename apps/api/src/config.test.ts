import { afterEach, describe, expect, it } from "vitest";
import { getAdminCredentials } from "./config.js";

const ORIGINAL_USER = process.env.ADMIN_USERNAME;
const ORIGINAL_PASS = process.env.ADMIN_PASSWORD;

afterEach(() => {
  if (ORIGINAL_USER === undefined) delete process.env.ADMIN_USERNAME;
  else process.env.ADMIN_USERNAME = ORIGINAL_USER;
  if (ORIGINAL_PASS === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = ORIGINAL_PASS;
});

describe("getAdminCredentials", () => {
  it("returns undefined when neither variable is set", () => {
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    expect(getAdminCredentials()).toBeUndefined();
  });

  it("returns undefined when only the username is set", () => {
    process.env.ADMIN_USERNAME = "admin";
    delete process.env.ADMIN_PASSWORD;
    expect(getAdminCredentials()).toBeUndefined();
  });

  it("returns undefined when only the password is set", () => {
    delete process.env.ADMIN_USERNAME;
    process.env.ADMIN_PASSWORD = "pw";
    expect(getAdminCredentials()).toBeUndefined();
  });

  it("returns undefined when a value is empty or whitespace", () => {
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD = "   ";
    expect(getAdminCredentials()).toBeUndefined();
  });

  it("returns trimmed credentials when both are set", () => {
    process.env.ADMIN_USERNAME = "  admin  ";
    process.env.ADMIN_PASSWORD = "  s3cret  ";
    expect(getAdminCredentials()).toEqual({
      username: "admin",
      password: "s3cret",
    });
  });
});

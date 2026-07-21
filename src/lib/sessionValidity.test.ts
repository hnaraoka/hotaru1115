import { describe, expect, it } from "vitest";
import { isSessionStillValid } from "@/lib/sessionValidity";

const AUTHENTICATED_AT = new Date("2026-07-21T00:00:00Z").getTime();

describe("isSessionStillValid", () => {
  it("is valid when active and the password hasn't changed since login", () => {
    const user = { isActive: true, passwordChangedAt: new Date("2026-07-01T00:00:00Z") };
    expect(isSessionStillValid(user, AUTHENTICATED_AT)).toBe(true);
  });

  it("is invalid when the account has been deactivated", () => {
    const user = { isActive: false, passwordChangedAt: new Date("2026-07-01T00:00:00Z") };
    expect(isSessionStillValid(user, AUTHENTICATED_AT)).toBe(false);
  });

  it("is invalid when the password was changed after the session was issued", () => {
    const user = { isActive: true, passwordChangedAt: new Date("2026-07-22T00:00:00Z") };
    expect(isSessionStillValid(user, AUTHENTICATED_AT)).toBe(false);
  });

  it("treats a password change at the exact login instant as still valid", () => {
    const user = { isActive: true, passwordChangedAt: new Date(AUTHENTICATED_AT) };
    expect(isSessionStillValid(user, AUTHENTICATED_AT)).toBe(true);
  });

  it("is invalid for a pre-existing session with no recorded authentication time (treated as 0)", () => {
    const user = { isActive: true, passwordChangedAt: new Date("2020-01-01T00:00:00Z") };
    expect(isSessionStillValid(user, 0)).toBe(false);
  });
});

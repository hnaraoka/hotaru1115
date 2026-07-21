import { describe, expect, it } from "vitest";
import { isUniqueConstraintError } from "@/lib/prismaErrors";

describe("isUniqueConstraintError", () => {
  it("recognizes a Prisma P2002 unique constraint violation", () => {
    expect(isUniqueConstraintError({ code: "P2002" })).toBe(true);
  });

  it("returns false for other Prisma error codes", () => {
    expect(isUniqueConstraintError({ code: "P2025" })).toBe(false);
  });

  it("returns false for non-object errors", () => {
    expect(isUniqueConstraintError("some string error")).toBe(false);
    expect(isUniqueConstraintError(null)).toBe(false);
    expect(isUniqueConstraintError(undefined)).toBe(false);
    expect(isUniqueConstraintError(42)).toBe(false);
  });

  it("returns false for a plain Error without a code property", () => {
    expect(isUniqueConstraintError(new Error("boom"))).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { normalizeRatingLabel } from "@/lib/reportImport/ratingLabels";

describe("normalizeRatingLabel", () => {
  it("maps current label wording to rating values", () => {
    expect(normalizeRatingLabel("大変良い")).toBe("EXCELLENT");
    expect(normalizeRatingLabel("良い")).toBe("GOOD");
    expect(normalizeRatingLabel("普通")).toBe("NORMAL");
    expect(normalizeRatingLabel("やや悪い")).toBe("SLIGHTLY_BAD");
    expect(normalizeRatingLabel("悪い")).toBe("BAD");
  });

  it("maps legacy Excel template wording to the same rating values", () => {
    expect(normalizeRatingLabel("少し懸念あり")).toBe("SLIGHTLY_BAD");
    expect(normalizeRatingLabel("要注意")).toBe("BAD");
  });

  it("trims surrounding whitespace before matching", () => {
    expect(normalizeRatingLabel("  良い  ")).toBe("GOOD");
  });

  it("returns undefined for unrecognized or empty input", () => {
    expect(normalizeRatingLabel("不明な文言")).toBeUndefined();
    expect(normalizeRatingLabel("")).toBeUndefined();
    expect(normalizeRatingLabel(undefined)).toBeUndefined();
    expect(normalizeRatingLabel(null)).toBeUndefined();
  });
});

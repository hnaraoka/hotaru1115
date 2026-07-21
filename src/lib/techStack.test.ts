import { describe, expect, it } from "vitest";
import { emptyTechStack, techStackItemsToRecord, techStackRecordToItems } from "@/lib/techStack";

describe("emptyTechStack", () => {
  it("returns an empty array for every category", () => {
    expect(emptyTechStack()).toEqual({
      LANGUAGE: [],
      FRAMEWORK: [],
      DATABASE: [],
      TOOL: [],
      OS_ENV: [],
    });
  });

  it("returns a fresh object each call (no shared array references)", () => {
    const a = emptyTechStack();
    const b = emptyTechStack();
    a.LANGUAGE.push("TypeScript");
    expect(b.LANGUAGE).toEqual([]);
  });
});

describe("techStackItemsToRecord", () => {
  it("groups items by category, preserving insertion order", () => {
    const record = techStackItemsToRecord([
      { category: "LANGUAGE", name: "TypeScript" },
      { category: "TOOL", name: "Git" },
      { category: "LANGUAGE", name: "Go" },
    ]);
    expect(record).toEqual({
      LANGUAGE: ["TypeScript", "Go"],
      FRAMEWORK: [],
      DATABASE: [],
      TOOL: ["Git"],
      OS_ENV: [],
    });
  });

  it("ignores items with an unknown category instead of throwing", () => {
    const record = techStackItemsToRecord([{ category: "UNKNOWN", name: "???" }]);
    expect(record).toEqual(emptyTechStack());
  });
});

describe("techStackRecordToItems", () => {
  it("flattens the record back into a category/name list in TECH_CATEGORY_OPTIONS order", () => {
    const record = techStackItemsToRecord([
      { category: "TOOL", name: "Git" },
      { category: "LANGUAGE", name: "TypeScript" },
    ]);
    expect(techStackRecordToItems(record)).toEqual([
      { category: "LANGUAGE", name: "TypeScript" },
      { category: "TOOL", name: "Git" },
    ]);
  });

  it("round-trips through techStackItemsToRecord", () => {
    const items = [
      { category: "LANGUAGE" as const, name: "TypeScript" },
      { category: "DATABASE" as const, name: "PostgreSQL" },
    ];
    expect(techStackRecordToItems(techStackItemsToRecord(items))).toEqual(items);
  });
});

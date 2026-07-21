import { TECH_CATEGORY_OPTIONS } from "@/lib/constants";
import type { TechCategoryValue } from "@/lib/constants";

export function emptyTechStack(): Record<TechCategoryValue, string[]> {
  return {
    LANGUAGE: [],
    FRAMEWORK: [],
    DATABASE: [],
    TOOL: [],
    OS_ENV: [],
  };
}

/** Groups a flat list of {category, name} tech-stack items back into the per-category record the form/UI uses. */
export function techStackItemsToRecord(
  items: { category: string; name: string }[],
): Record<TechCategoryValue, string[]> {
  const techStack = emptyTechStack();
  for (const item of items) {
    techStack[item.category as TechCategoryValue]?.push(item.name);
  }
  return techStack;
}

export function techStackRecordToItems(
  record: Record<TechCategoryValue, string[]>,
): { category: TechCategoryValue; name: string }[] {
  return TECH_CATEGORY_OPTIONS.flatMap(({ value }) => record[value].map((name) => ({ category: value, name })));
}

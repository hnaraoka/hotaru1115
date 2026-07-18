// Fixed-order categorical palette (validated: see dataviz skill references/palette.md).
// Order must not be re-cycled per series — only fold extra series into "その他".
export const CATEGORICAL_PALETTE = [
  "#2a78d6", // blue
  "#008300", // green
  "#e87ba4", // magenta
  "#eda100", // yellow
  "#1baf7a", // aqua
  "#eb6834", // orange
  "#4a3aa7", // violet
  "#e34948", // red
] as const;

export type WorkAllocationSlice = { category: string; percentage: number };

export function foldToPaletteSlots(
  items: WorkAllocationSlice[],
  maxSlots = CATEGORICAL_PALETTE.length,
): WorkAllocationSlice[] {
  if (items.length <= maxSlots) return items;
  const sorted = [...items].sort((a, b) => b.percentage - a.percentage);
  const head = sorted.slice(0, maxSlots - 1);
  const rest = sorted.slice(maxSlots - 1);
  const restTotal = rest.reduce((sum, item) => sum + item.percentage, 0);
  return [...head, { category: "その他", percentage: restTotal }];
}

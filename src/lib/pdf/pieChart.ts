export type PieSlice = {
  category: string;
  percentage: number;
  color: string;
  path: string;
  labelX: number;
  labelY: number;
};

/**
 * Builds SVG arc paths for a pie chart centered at (cx, cy) with radius r.
 * Angles are measured clockwise from the top (12 o'clock), matching typical
 * pie-chart reading order.
 */
export function buildPieSlices(
  items: { category: string; percentage: number }[],
  colors: readonly string[],
  cx: number,
  cy: number,
  r: number,
): PieSlice[] {
  const total = items.reduce((sum, item) => sum + item.percentage, 0) || 1;
  let cursor = 0;
  const slices: PieSlice[] = [];

  items.forEach((item, index) => {
    const startAngle = (cursor / total) * 2 * Math.PI;
    cursor += item.percentage;
    const endAngle = (cursor / total) * 2 * Math.PI;

    const x1 = cx + r * Math.sin(startAngle);
    const y1 = cy - r * Math.cos(startAngle);
    const x2 = cx + r * Math.sin(endAngle);
    const y2 = cy - r * Math.cos(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    const path =
      item.percentage >= total
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    const midAngle = (startAngle + endAngle) / 2;
    const labelR = r * 0.65;
    const labelX = cx + labelR * Math.sin(midAngle);
    const labelY = cy - labelR * Math.cos(midAngle);

    slices.push({
      category: item.category,
      percentage: item.percentage,
      color: colors[index % colors.length],
      path,
      labelX,
      labelY,
    });
  });

  return slices;
}

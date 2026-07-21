import type { ReactNode } from "react";

export function SimpleTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: { key: string | number; cells: ReactNode[] }[];
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
            {columns.map((c) => (
              <th key={c} style={{ padding: 6 }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} style={{ borderBottom: "1px solid var(--border)" }}>
              {row.cells.map((cell, i) => (
                <td key={i} style={{ padding: 6 }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

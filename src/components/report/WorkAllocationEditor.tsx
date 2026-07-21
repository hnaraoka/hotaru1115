"use client";

import { WORK_ALLOCATION_SUGGESTIONS } from "@/lib/constants";

// percentage is kept as the raw input string (like every other numeric field
// in the report form) rather than a number, so an emptied field is simply ""
// instead of needing a NaN sentinel. NaN doesn't survive JSON.stringify (it
// serializes to null), which used to turn a blank percentage into a null
// sent to the API with no clear signal that the field was left empty.
export type WorkAllocationRow = { category: string; percentage: string };

const SUGGESTION_LIST_ID = "work-allocation-suggestions";

function toFinitePercentage(value: string): number {
  const n = Number(value);
  return value.trim() !== "" && Number.isFinite(n) ? n : 0;
}

export function WorkAllocationEditor({
  rows,
  onChange,
}: {
  rows: WorkAllocationRow[];
  onChange: (rows: WorkAllocationRow[]) => void;
}) {
  const total = rows.reduce((sum, row) => sum + toFinitePercentage(row.percentage), 0);

  function updateRow(index: number, patch: Partial<WorkAllocationRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...rows, { category: "", percentage: "0" }]);
  }

  return (
    <div className="work-allocation">
      <datalist id={SUGGESTION_LIST_ID}>
        {WORK_ALLOCATION_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {rows.map((row, i) => (
        <div key={i} className="work-allocation-row">
          <input
            value={row.category}
            onChange={(e) => updateRow(i, { category: e.target.value })}
            placeholder="例: 打ち合わせ"
            list={SUGGESTION_LIST_ID}
          />
          <div className="work-allocation-percentage">
            <input
              type="number"
              min={0}
              max={100}
              value={row.percentage}
              onChange={(e) => updateRow(i, { percentage: e.target.value })}
            />
            <span>%</span>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => removeRow(i)}>
            削除
          </button>
        </div>
      ))}

      <div className="work-allocation-footer">
        <button type="button" className="btn btn-secondary" onClick={addRow}>
          ＋ 項目を追加
        </button>
        <span className={`work-allocation-total ${total === 100 ? "ok" : "warn"}`}>
          合計: {total}% {total === 100 ? "✓" : "（100%になるようにしてください）"}
        </span>
      </div>
    </div>
  );
}

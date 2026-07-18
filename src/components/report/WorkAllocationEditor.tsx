"use client";

export type WorkAllocationRow = { category: string; percentage: number };

export function WorkAllocationEditor({
  rows,
  onChange,
}: {
  rows: WorkAllocationRow[];
  onChange: (rows: WorkAllocationRow[]) => void;
}) {
  const total = rows.reduce((sum, row) => sum + (Number.isFinite(row.percentage) ? row.percentage : 0), 0);

  function updateRow(index: number, patch: Partial<WorkAllocationRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...rows, { category: "", percentage: 0 }]);
  }

  return (
    <div className="work-allocation">
      {rows.map((row, i) => (
        <div key={i} className="work-allocation-row">
          <input
            value={row.category}
            onChange={(e) => updateRow(i, { category: e.target.value })}
            placeholder="例: 打ち合わせ"
          />
          <div className="work-allocation-percentage">
            <input
              type="number"
              min={0}
              max={100}
              value={Number.isNaN(row.percentage) ? "" : row.percentage}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  updateRow(i, { percentage: NaN });
                  return;
                }
                const n = Number(raw);
                if (!Number.isNaN(n)) updateRow(i, { percentage: n });
              }}
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

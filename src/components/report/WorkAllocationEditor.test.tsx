import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkAllocationEditor, type WorkAllocationRow } from "@/components/report/WorkAllocationEditor";

describe("WorkAllocationEditor", () => {
  it("shows a warning total until percentages sum to exactly 100", () => {
    const rows: WorkAllocationRow[] = [
      { category: "実装", percentage: "60" },
      { category: "打ち合わせ", percentage: "20" },
    ];
    render(<WorkAllocationEditor rows={rows} onChange={vi.fn()} />);
    expect(screen.getByText(/合計: 80%/)).toBeInTheDocument();
    expect(screen.getByText(/合計: 80%/)).toHaveClass("warn");
  });

  it("shows an ok total when percentages sum to exactly 100", () => {
    const rows: WorkAllocationRow[] = [
      { category: "実装", percentage: "80" },
      { category: "打ち合わせ", percentage: "20" },
    ];
    render(<WorkAllocationEditor rows={rows} onChange={vi.fn()} />);
    expect(screen.getByText(/合計: 100%/)).toHaveClass("ok");
  });

  it("treats a blank percentage field as 0 in the total instead of NaN", () => {
    const rows: WorkAllocationRow[] = [
      { category: "実装", percentage: "" },
      { category: "打ち合わせ", percentage: "20" },
    ];
    render(<WorkAllocationEditor rows={rows} onChange={vi.fn()} />);
    expect(screen.getByText(/合計: 20%/)).toBeInTheDocument();
  });

  it("keeps the raw string in the input value, so a cleared field renders as empty rather than 0", () => {
    const rows: WorkAllocationRow[] = [{ category: "実装", percentage: "" }];
    render(<WorkAllocationEditor rows={rows} onChange={vi.fn()} />);
    const percentageInput = screen.getByDisplayValue("実装").closest(".work-allocation-row")!.querySelector(
      'input[type="number"]',
    ) as HTMLInputElement;
    expect(percentageInput.value).toBe("");
  });

  it("passes the raw typed string straight through onChange (no premature parsing)", () => {
    const onChange = vi.fn();
    const rows: WorkAllocationRow[] = [{ category: "実装", percentage: "5" }];
    render(<WorkAllocationEditor rows={rows} onChange={onChange} />);

    const percentageInput = screen.getByDisplayValue("実装").closest(".work-allocation-row")!.querySelector(
      'input[type="number"]',
    ) as HTMLInputElement;
    fireEvent.change(percentageInput, { target: { value: "50" } });

    expect(onChange).toHaveBeenCalledWith([{ category: "実装", percentage: "50" }]);
  });

  it("adds a new row defaulting to 0%", () => {
    const onChange = vi.fn();
    render(<WorkAllocationEditor rows={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText("＋ 項目を追加"));
    expect(onChange).toHaveBeenCalledWith([{ category: "", percentage: "0" }]);
  });

  it("removes a row", () => {
    const onChange = vi.fn();
    const rows: WorkAllocationRow[] = [
      { category: "実装", percentage: "50" },
      { category: "打ち合わせ", percentage: "50" },
    ];
    render(<WorkAllocationEditor rows={rows} onChange={onChange} />);
    fireEvent.click(screen.getAllByText("削除")[0]);
    expect(onChange).toHaveBeenCalledWith([{ category: "打ち合わせ", percentage: "50" }]);
  });
});

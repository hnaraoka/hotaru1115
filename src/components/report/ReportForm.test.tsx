import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReportForm } from "@/components/report/ReportForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: false, json: async () => null }),
  );
});

describe("ReportForm (new report)", () => {
  it("renders every section without crashing", async () => {
    render(<ReportForm />);

    // Wait for the /api/reports/latest effect to settle so it doesn't warn
    // about state updates after the test finishes.
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/reports/latest"));

    expect(screen.getByLabelText("提出日 *")).toBeInTheDocument();
    expect(screen.getByLabelText("参画先企業 *")).toBeInTheDocument();
    expect(screen.getByLabelText("プロジェクト名 *")).toBeInTheDocument();
    expect(screen.getByLabelText("作業内容 *")).toBeInTheDocument();
    expect(screen.getByLabelText("体調 *")).toBeInTheDocument();
    expect(screen.getByText("＋ 項目を追加")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存する" })).toBeInTheDocument();
  });

  it("shows field-level validation errors instead of submitting when required fields are missing", async () => {
    const { container } = render(<ReportForm />);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/reports/latest"));

    // Dispatch the submit event directly rather than clicking the button:
    // clicking would trigger the browser's native HTML5 "required" gate
    // (blocking before React ever sees the event) since most fields start
    // empty. Submitting the form directly exercises our own zod-based
    // validation, which is what this test is about.
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => {
      expect(screen.getByText(/入力内容に誤りがあります/)).toBeInTheDocument();
    });
    // A POST to /api/reports must not have been attempted.
    expect(fetch).not.toHaveBeenCalledWith("/api/reports", expect.anything());
  });

  it("lets the user type into the project name field", async () => {
    render(<ReportForm />);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/reports/latest"));

    const input = screen.getByLabelText("プロジェクト名 *") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "新プロジェクト" } });
    expect(input.value).toBe("新プロジェクト");
  });
});

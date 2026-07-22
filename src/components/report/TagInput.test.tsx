import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TagInput } from "@/components/report/TagInput";

describe("TagInput", () => {
  it("adds a tag on Enter", () => {
    const onChange = vi.fn();
    render(<TagInput label="言語" values={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText("入力してEnterで追加");
    fireEvent.change(input, { target: { value: "TypeScript" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["TypeScript"]);
  });

  it("does not add a tag on Enter while an IME composition is in progress", () => {
    const onChange = vi.fn();
    render(<TagInput label="言語" values={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText("入力してEnterで追加");
    fireEvent.change(input, { target: { value: "にほんご" } });
    // Enter pressed to confirm a kana->kanji conversion mid-composition.
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("still adds the tag once composition has ended and Enter is pressed for real", () => {
    const onChange = vi.fn();
    render(<TagInput label="言語" values={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText("入力してEnterで追加");
    fireEvent.change(input, { target: { value: "日本語" } });
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["日本語"]);
  });

  it("adds a tag on comma", () => {
    const onChange = vi.fn();
    render(<TagInput label="言語" values={["Go"]} onChange={onChange} />);
    const input = screen.getByPlaceholderText("入力してEnterで追加");
    fireEvent.change(input, { target: { value: "Rust" } });
    fireEvent.keyDown(input, { key: "," });
    expect(onChange).toHaveBeenCalledWith(["Go", "Rust"]);
  });

  it("does not add a duplicate tag", () => {
    const onChange = vi.fn();
    render(<TagInput label="言語" values={["Go"]} onChange={onChange} />);
    const input = screen.getByPlaceholderText("入力してEnterで追加");
    fireEvent.change(input, { target: { value: "Go" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes a tag when its delete button is clicked", () => {
    const onChange = vi.fn();
    render(<TagInput label="言語" values={["Go", "Rust"]} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Go を削除"));
    expect(onChange).toHaveBeenCalledWith(["Rust"]);
  });
});

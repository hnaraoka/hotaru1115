import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "@/lib/csv";

describe("parseCsv", () => {
  it("parses simple comma-separated rows", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("normalizes CRLF and bare CR line endings to LF", () => {
    expect(parseCsv("a,b\r\n1,2\r3,4")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("handles quoted fields containing commas and newlines", () => {
    const input = 'name,note\n"山田,太郎","改行を\n含むメモ"';
    expect(parseCsv(input)).toEqual([
      ["name", "note"],
      ["山田,太郎", "改行を\n含むメモ"],
    ]);
  });

  it("unescapes doubled quotes inside quoted fields", () => {
    expect(parseCsv('"say ""hi"""')).toEqual([['say "hi"']]);
  });

  it("skips blank lines", () => {
    expect(parseCsv("a,b\n\n1,2\n   \n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("toCsv", () => {
  it("joins fields with commas and rows with CRLF", () => {
    expect(
      toCsv([
        ["a", "b"],
        ["1", "2"],
      ]),
    ).toBe("a,b\r\n1,2");
  });

  it("quotes fields containing commas, quotes, or newlines", () => {
    expect(toCsv([["山田,太郎", 'say "hi"', "line1\nline2", "plain"]])).toBe(
      '"山田,太郎","say ""hi""","line1\nline2",plain',
    );
  });

  it("round-trips through parseCsv", () => {
    const rows = [
      ["ログインID", "氏名", "権限", "メールアドレス"],
      ["yamada.taro", "山田, 太郎", "一般", ""],
      ["sato.hanako", '佐藤"花子"', "管理者", "sato@example.com"],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

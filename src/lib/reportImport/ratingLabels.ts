import type { RatingValue } from "@/lib/constants";

// アプリの表記（大変良い/良い/普通/やや悪い/悪い）に加えて、Excelから出力される
// 帳票の表記（少し懸念あり/要注意）も同じ5段階として正規化する。
const RATING_LABEL_TO_VALUE: Record<string, RatingValue> = {
  "大変良い": "EXCELLENT",
  "良い": "GOOD",
  "普通": "NORMAL",
  "やや悪い": "SLIGHTLY_BAD",
  "悪い": "BAD",
  "少し懸念あり": "SLIGHTLY_BAD",
  "要注意": "BAD",
};

export function normalizeRatingLabel(text: string | undefined | null): RatingValue | undefined {
  if (!text) return undefined;
  return RATING_LABEL_TO_VALUE[text.trim()];
}

"use client";

import { useState } from "react";

export function CopyTextButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("コピーに失敗しました。手動で選択してコピーしてください。");
    }
  }

  return (
    <button type="button" className="btn btn-secondary" onClick={handleCopy}>
      {copied ? "コピーしました" : label}
    </button>
  );
}

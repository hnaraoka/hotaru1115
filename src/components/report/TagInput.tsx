"use client";

import { useState } from "react";

export function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const value = draft.trim();
    if (!value || values.includes(value)) {
      setDraft("");
      return;
    }
    onChange([...values, value]);
    setDraft("");
  }

  function removeTag(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="field">
      <label>{label}</label>
      <div className="tag-input">
        <div className="tag-list">
          {values.map((v, i) => (
            <span key={`${v}-${i}`} className="tag-chip">
              {v}
              <button type="button" onClick={() => removeTag(i)} aria-label={`${v} を削除`}>
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // e.nativeEvent.isComposing / keyCode 229 guard against Enter
            // fired while an IME (e.g. Japanese kana→kanji conversion) is
            // still composing — without it, confirming a conversion commits
            // the not-yet-finalized text as a tag instead of just finishing
            // the conversion.
            if (e.nativeEvent.isComposing || e.keyCode === 229) return;
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
          placeholder={placeholder ?? "入力してEnterで追加"}
        />
      </div>
    </div>
  );
}

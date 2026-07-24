"use client";

import { DEV_PROCESS_OPTIONS } from "@/lib/constants";

export function DevProcessCheckboxes({
  selected,
  onChange,
  disabled,
}: {
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}) {
  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((v) => v !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  return (
    <div className="dev-process-grid">
      {DEV_PROCESS_OPTIONS.map((option) => (
        <label key={option} className="dev-process-item">
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => toggle(option)}
            disabled={disabled}
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

import { RATING_FIELDS, RATING_OPTIONS } from "@/lib/constants";
import { FieldErrorText } from "@/components/report/FormFieldHelpers";
import type { SectionProps } from "@/components/report/reportFormTypes";

export function SelfRatingSection({ state, update, fieldClass, errorsFor }: SectionProps) {
  return (
    <>
      <div className="section-title">自己評価</div>
      <div className="form-row">
        {RATING_FIELDS.map(({ key, label }) => (
          <div className={fieldClass(key)} key={key}>
            <label htmlFor={key}>{label} *</label>
            <select id={key} value={state[key]} onChange={(e) => update(key, e.target.value)} required>
              <option value="" disabled>
                選択してください
              </option>
              {RATING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <FieldErrorText messages={errorsFor(key)} />
          </div>
        ))}
      </div>
    </>
  );
}

import { TECH_CATEGORY_OPTIONS } from "@/lib/constants";
import { TagInput } from "@/components/report/TagInput";
import { FieldErrorText } from "@/components/report/FormFieldHelpers";
import type { SectionProps } from "@/components/report/reportFormTypes";

export function TechStackSection({ state, update, errorsFor }: SectionProps) {
  return (
    <>
      <div className="section-title">技術スタック</div>
      {errorsFor("techStackItems").length > 0 && (
        <div className="field has-error" style={{ gap: 0 }}>
          <FieldErrorText messages={errorsFor("techStackItems")} />
        </div>
      )}
      <div className="form-row">
        {TECH_CATEGORY_OPTIONS.map(({ value, label }) => (
          <TagInput
            key={value}
            label={label}
            values={state.techStack[value]}
            onChange={(values) => update("techStack", { ...state.techStack, [value]: values })}
          />
        ))}
      </div>
    </>
  );
}

import { FieldErrorText, ReferenceField } from "@/components/report/FormFieldHelpers";
import type { ReferenceFields, SectionProps } from "@/components/report/reportFormTypes";

type OutcomeSectionProps = SectionProps & {
  referenceContent: ReferenceFields;
  onCopyReference: (key: "deliverables" | "troubles" | "goodPoints", value: string) => void;
};

export function OutcomeSection({ state, update, fieldClass, errorsFor, referenceContent, onCopyReference }: OutcomeSectionProps) {
  return (
    <>
      <div className="section-title">成果物・所感</div>
      <div className={fieldClass("deliverables")}>
        <label htmlFor="deliverables">成果物</label>
        <textarea
          id="deliverables"
          value={state.deliverables}
          onChange={(e) => update("deliverables", e.target.value)}
          maxLength={1000}
        />
        <span className="hint">{state.deliverables.length} / 1000文字</span>
        <FieldErrorText messages={errorsFor("deliverables")} />
        <ReferenceField
          label="前回の成果物"
          value={referenceContent.deliverables}
          onCopy={() => onCopyReference("deliverables", referenceContent.deliverables!)}
        />
      </div>
      <div className={fieldClass("troubles")}>
        <label htmlFor="troubles">今月の困った点と対応・解決方法</label>
        <textarea
          id="troubles"
          value={state.troubles}
          onChange={(e) => update("troubles", e.target.value)}
          maxLength={1000}
        />
        <span className="hint">{state.troubles.length} / 1000文字</span>
        <FieldErrorText messages={errorsFor("troubles")} />
        <ReferenceField
          label="前回の困った点・対応方法"
          value={referenceContent.troubles}
          onCopy={() => onCopyReference("troubles", referenceContent.troubles!)}
        />
      </div>
      <div className={fieldClass("goodPoints")}>
        <label htmlFor="goodPoints">今月の良かった点/改善提案など</label>
        <textarea
          id="goodPoints"
          value={state.goodPoints}
          onChange={(e) => update("goodPoints", e.target.value)}
          maxLength={1000}
        />
        <span className="hint">{state.goodPoints.length} / 1000文字</span>
        <FieldErrorText messages={errorsFor("goodPoints")} />
        <ReferenceField
          label="前回の良かった点・改善提案"
          value={referenceContent.goodPoints}
          onCopy={() => onCopyReference("goodPoints", referenceContent.goodPoints!)}
        />
      </div>
    </>
  );
}

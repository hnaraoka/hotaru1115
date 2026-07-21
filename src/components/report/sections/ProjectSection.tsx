import { FieldErrorText, ReferenceField } from "@/components/report/FormFieldHelpers";
import { DevProcessCheckboxes } from "@/components/report/DevProcessCheckboxes";
import type { SectionProps } from "@/components/report/reportFormTypes";

type ProjectSectionProps = SectionProps & {
  computedPeriodMonths: string;
  workContentReference: string | undefined;
  onCopyWorkContentReference: () => void;
};

export function ProjectSection({
  state,
  update,
  fieldClass,
  errorsFor,
  computedPeriodMonths,
  workContentReference,
  onCopyWorkContentReference,
}: ProjectSectionProps) {
  return (
    <>
      <div className="section-title">プロジェクト</div>
      <div className={fieldClass("projectName")}>
        <label htmlFor="projectName">プロジェクト名 *</label>
        <input
          id="projectName"
          value={state.projectName}
          onChange={(e) => update("projectName", e.target.value)}
          required
          maxLength={200}
        />
        <FieldErrorText messages={errorsFor("projectName")} />
      </div>

      <div className="form-row">
        <div className={fieldClass("projectPeriodStartYear", "projectPeriodStartMonth")}>
          <label>プロジェクト参画年月</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number"
              placeholder="年"
              value={state.projectPeriodStartYear}
              onChange={(e) => update("projectPeriodStartYear", e.target.value)}
            />
            <input
              type="number"
              placeholder="月"
              value={state.projectPeriodStartMonth}
              onChange={(e) => update("projectPeriodStartMonth", e.target.value)}
            />
          </div>
          <FieldErrorText messages={errorsFor("projectPeriodStartYear", "projectPeriodStartMonth")} />
        </div>
        <div className={fieldClass("projectPeriodOngoing")}>
          <label htmlFor="projectPeriodOngoing">状況</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 42 }}>
            <input
              id="projectPeriodOngoing"
              type="checkbox"
              style={{ width: "auto" }}
              checked={state.projectPeriodOngoing}
              onChange={(e) => update("projectPeriodOngoing", e.target.checked)}
            />
            <label htmlFor="projectPeriodOngoing" style={{ marginBottom: 0 }}>
              現在も継続中
            </label>
          </div>
        </div>
        {!state.projectPeriodOngoing && (
          <div className={fieldClass("projectPeriodEndYear", "projectPeriodEndMonth")}>
            <label>期間終了</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                placeholder="年"
                value={state.projectPeriodEndYear}
                onChange={(e) => update("projectPeriodEndYear", e.target.value)}
              />
              <input
                type="number"
                placeholder="月"
                value={state.projectPeriodEndMonth}
                onChange={(e) => update("projectPeriodEndMonth", e.target.value)}
              />
            </div>
            <FieldErrorText messages={errorsFor("projectPeriodEndYear", "projectPeriodEndMonth")} />
          </div>
        )}
        <div className="field">
          <label htmlFor="projectPeriodMonths">期間(ヶ月数)</label>
          <input id="projectPeriodMonths" type="number" value={computedPeriodMonths} disabled />
          <span className="hint">プロジェクト参画年月と対象年/対象月から自動計算されます</span>
        </div>
      </div>

      <div className={fieldClass("workContent")}>
        <label htmlFor="workContent">作業内容 *</label>
        <textarea
          id="workContent"
          value={state.workContent}
          onChange={(e) => update("workContent", e.target.value)}
          required
          placeholder="箇条書きで入力してください"
          style={{ minHeight: 120 }}
          maxLength={2000}
        />
        <span className="hint">{state.workContent.length} / 2000文字</span>
        <FieldErrorText messages={errorsFor("workContent")} />
        <ReferenceField label="前回の作業内容" value={workContentReference} onCopy={onCopyWorkContentReference} />
      </div>

      <div className={fieldClass("devProcesses")}>
        <label>開発工程 *</label>
        <DevProcessCheckboxes selected={state.devProcesses} onChange={(v) => update("devProcesses", v)} />
        <FieldErrorText messages={errorsFor("devProcesses")} />
      </div>
    </>
  );
}

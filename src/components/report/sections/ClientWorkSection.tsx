import { FieldErrorText } from "@/components/report/FormFieldHelpers";
import type { SectionProps } from "@/components/report/reportFormTypes";

export function ClientWorkSection({ state, update, fieldClass, errorsFor }: SectionProps) {
  return (
    <>
      <div className="section-title">参画先・勤務</div>
      <div className="form-row">
        <div className={fieldClass("clientCompany")}>
          <label htmlFor="clientCompany">参画先企業 *</label>
          <input
            id="clientCompany"
            value={state.clientCompany}
            onChange={(e) => update("clientCompany", e.target.value)}
            required
            maxLength={200}
          />
          <FieldErrorText messages={errorsFor("clientCompany")} />
        </div>
        <div className={fieldClass("workLocation")}>
          <label htmlFor="workLocation">作業場所 *</label>
          <input
            id="workLocation"
            value={state.workLocation}
            onChange={(e) => update("workLocation", e.target.value)}
            required
            maxLength={200}
          />
          <FieldErrorText messages={errorsFor("workLocation")} />
        </div>
      </div>

      <div className="form-row">
        <div className={fieldClass("workDays")}>
          <label htmlFor="workDays">月間実労働日数 *</label>
          <input
            id="workDays"
            type="number"
            value={state.workDays}
            onChange={(e) => update("workDays", e.target.value)}
            required
          />
          <FieldErrorText messages={errorsFor("workDays")} />
        </div>
        <div className={fieldClass("workHours")}>
          <label htmlFor="workHours">月間実労働時間 *</label>
          <input
            id="workHours"
            type="number"
            step="0.5"
            value={state.workHours}
            onChange={(e) => update("workHours", e.target.value)}
            required
          />
          <FieldErrorText messages={errorsFor("workHours")} />
        </div>
        <div className={fieldClass("teleworkDays")}>
          <label htmlFor="teleworkDays">テレワーク日数 *</label>
          <input
            id="teleworkDays"
            type="number"
            value={state.teleworkDays}
            onChange={(e) => update("teleworkDays", e.target.value)}
            required
          />
          <FieldErrorText messages={errorsFor("teleworkDays")} />
        </div>
        <div className={fieldClass("onsiteDays")}>
          <label htmlFor="onsiteDays">現場日数 *</label>
          <input
            id="onsiteDays"
            type="number"
            value={state.onsiteDays}
            onChange={(e) => update("onsiteDays", e.target.value)}
            required
          />
          <FieldErrorText messages={errorsFor("onsiteDays")} />
        </div>
      </div>
    </>
  );
}

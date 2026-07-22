import { MONTH_OPTIONS } from "@/lib/constants";
import { FieldErrorText } from "@/components/report/FormFieldHelpers";
import type { SectionProps } from "@/components/report/reportFormTypes";

type BasicInfoSectionProps = SectionProps & {
  computedAge: string;
  computedExperienceYears: string;
  ageAvailable: boolean;
  experienceAvailable: boolean;
};

export function BasicInfoSection({
  state,
  update,
  fieldClass,
  errorsFor,
  computedAge,
  computedExperienceYears,
  ageAvailable,
  experienceAvailable,
}: BasicInfoSectionProps) {
  return (
    <>
      <div className="section-title" style={{ borderTop: "none", paddingTop: 0 }}>
        基本情報
      </div>
      <div className="form-row">
        <div className={fieldClass("submittedAt")}>
          <label htmlFor="submittedAt">提出日 *</label>
          <input
            id="submittedAt"
            type="date"
            value={state.submittedAt}
            onChange={(e) => update("submittedAt", e.target.value)}
            required
          />
          <FieldErrorText messages={errorsFor("submittedAt")} />
        </div>
        <div className={fieldClass("targetYear")}>
          <label htmlFor="targetYear">対象年 *</label>
          <input
            id="targetYear"
            type="number"
            value={state.targetYear}
            onChange={(e) => update("targetYear", Number(e.target.value))}
            required
          />
          <FieldErrorText messages={errorsFor("targetYear")} />
        </div>
        <div className={fieldClass("targetMonth")}>
          <label htmlFor="targetMonth">対象月 *</label>
          <select
            id="targetMonth"
            value={state.targetMonth}
            onChange={(e) => update("targetMonth", Number(e.target.value))}
            required
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}月
              </option>
            ))}
          </select>
          <FieldErrorText messages={errorsFor("targetMonth")} />
        </div>
      </div>

      <div className="form-row">
        <div className={fieldClass("gender")}>
          <label htmlFor="gender">性別</label>
          <select id="gender" value={state.gender} onChange={(e) => update("gender", e.target.value)}>
            <option value="">選択してください</option>
            <option value="男性">男性</option>
            <option value="女性">女性</option>
          </select>
          <FieldErrorText messages={errorsFor("gender")} />
        </div>
        <div className={fieldClass("age")}>
          <label htmlFor="age">年齢</label>
          <input id="age" type="number" value={computedAge} disabled />
          <span className="hint">
            {ageAvailable
              ? "対象年月時点の年齢が生年月日から自動計算されます"
              : "生年月日が未登録のため計算できません（管理者に設定を依頼してください）"}
          </span>
          <FieldErrorText messages={errorsFor("age")} />
        </div>
        <div className={fieldClass("experienceYears")}>
          <label htmlFor="experienceYears">経験年数</label>
          <input id="experienceYears" type="number" value={computedExperienceYears} disabled />
          <span className="hint">
            {experienceAvailable
              ? "対象年月時点の経験年数がエンジニア開始年月から自動計算されます"
              : "エンジニア開始年月が未登録のため計算できません"}
          </span>
          <FieldErrorText messages={errorsFor("experienceYears")} />
        </div>
      </div>
    </>
  );
}

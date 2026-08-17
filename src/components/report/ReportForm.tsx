"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Report, TechStackItem, WorkAllocation } from "@prisma/client";
import { buildReportInputSchema, type ReportInput } from "@/lib/reportSchema";
import { emptyTechStack, techStackItemsToRecord, techStackRecordToItems } from "@/lib/techStack";
import { calculateAgeAsOf, calculateExperienceYears } from "@/lib/ageCalc";
import type { ParsedReportFields } from "@/lib/excelImport/parseReportWorkbook";
import type { FormState, ReferenceFields } from "@/components/report/reportFormTypes";
import { WorkAllocationEditor } from "@/components/report/WorkAllocationEditor";
import { ImportAndCarryOverBanner } from "@/components/report/sections/ImportAndCarryOverBanner";
import { BasicInfoSection } from "@/components/report/sections/BasicInfoSection";
import { ClientWorkSection } from "@/components/report/sections/ClientWorkSection";
import { TechStackSection } from "@/components/report/sections/TechStackSection";
import { ProjectSection } from "@/components/report/sections/ProjectSection";
import { OutcomeSection } from "@/components/report/sections/OutcomeSection";
import { SelfRatingSection } from "@/components/report/sections/SelfRatingSection";
import { FieldErrorText } from "@/components/report/FormFieldHelpers";

type ReportWithRelations = Report & { techStackItems: TechStackItem[]; workAllocations: WorkAllocation[] };

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function buildInitialState(report?: ReportWithRelations): FormState {
  if (!report) {
    const now = new Date();
    return {
      submittedAt: todayISODate(),
      targetYear: now.getFullYear(),
      targetMonth: now.getMonth() + 1,
      gender: "",
      clientCompany: "",
      workLocation: "",
      workDays: "",
      workHours: "",
      teleworkDays: "",
      onsiteDays: "",
      projectName: "",
      projectPeriodStartYear: "",
      projectPeriodStartMonth: "",
      projectPeriodOngoing: true,
      projectPeriodEndYear: "",
      projectPeriodEndMonth: "",
      projectPeriodMonths: "",
      workContent: "",
      devProcesses: [],
      deliverables: "",
      troubles: "",
      goodPoints: "",
      condition: "",
      motivation: "",
      workload: "",
      difficulty: "",
      teamConsultability: "",
      growth: "",
      techStack: emptyTechStack(),
      workAllocations: [],
    };
  }

  return {
    submittedAt: new Date(report.submittedAt).toISOString().slice(0, 10),
    targetYear: report.targetYear,
    targetMonth: report.targetMonth,
    gender: report.gender ?? "",
    clientCompany: report.clientCompany,
    workLocation: report.workLocation,
    workDays: report.workDays?.toString() ?? "",
    workHours: report.workHours?.toString() ?? "",
    teleworkDays: report.teleworkDays?.toString() ?? "",
    onsiteDays: report.onsiteDays?.toString() ?? "",
    projectName: report.projectName,
    projectPeriodStartYear: report.projectPeriodStartYear?.toString() ?? "",
    projectPeriodStartMonth: report.projectPeriodStartMonth?.toString() ?? "",
    projectPeriodOngoing: report.projectPeriodOngoing,
    projectPeriodEndYear: report.projectPeriodEndYear?.toString() ?? "",
    projectPeriodEndMonth: report.projectPeriodEndMonth?.toString() ?? "",
    projectPeriodMonths: report.projectPeriodMonths?.toString() ?? "",
    workContent: report.workContent,
    devProcesses: report.devProcesses,
    deliverables: report.deliverables ?? "",
    troubles: report.troubles ?? "",
    goodPoints: report.goodPoints ?? "",
    condition: report.condition ?? "",
    motivation: report.motivation ?? "",
    workload: report.workload ?? "",
    difficulty: report.difficulty ?? "",
    teamConsultability: report.teamConsultability ?? "",
    growth: report.growth ?? "",
    techStack: techStackItemsToRecord(report.techStackItems),
    workAllocations: report.workAllocations
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((w) => ({ category: w.category, percentage: String(w.percentage) })),
  };
}

function nextMonthAfter(year: number, month: number): { year: number; month: number } {
  return month >= 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

function toNullableInt(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toNullableFloat(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Months elapsed from the project join date (プロジェクト参画年月) through
// this report's target month, inclusive: e.g. joining and reporting in the
// same month is "1", the following month is "2".
function computeProjectPeriodMonths(
  startYearStr: string,
  startMonthStr: string,
  targetYear: number,
  targetMonth: number,
): string {
  const startYear = toNullableInt(startYearStr);
  const startMonth = toNullableInt(startMonthStr);
  if (startYear === null || startMonth === null) return "";
  if (startYear < 2000 || startYear > 2100 || startMonth < 1 || startMonth > 12) return "";
  return String((targetYear - startYear) * 12 + (targetMonth - startMonth) + 1);
}

function buildPayload(
  state: FormState,
  computedAge: string,
  computedExperienceYears: string,
  workType: "ENGINEER" | "OFFICE",
): unknown {
  const isOfficeWork = workType === "OFFICE";
  return {
    submittedAt: state.submittedAt,
    targetYear: state.targetYear,
    targetMonth: state.targetMonth,
    gender: state.gender || null,
    age: toNullableInt(computedAge),
    experienceYears: toNullableInt(computedExperienceYears),
    clientCompany: state.clientCompany,
    workLocation: state.workLocation,
    workDays: toNullableInt(state.workDays),
    workHours: toNullableFloat(state.workHours),
    teleworkDays: toNullableInt(state.teleworkDays),
    onsiteDays: toNullableInt(state.onsiteDays),
    projectName: state.projectName,
    projectPeriodStartYear: toNullableInt(state.projectPeriodStartYear),
    projectPeriodStartMonth: toNullableInt(state.projectPeriodStartMonth),
    projectPeriodOngoing: state.projectPeriodOngoing,
    projectPeriodEndYear: toNullableInt(state.projectPeriodEndYear),
    projectPeriodEndMonth: toNullableInt(state.projectPeriodEndMonth),
    projectPeriodMonths: toNullableInt(
      computeProjectPeriodMonths(
        state.projectPeriodStartYear,
        state.projectPeriodStartMonth,
        state.targetYear,
        state.targetMonth,
      ),
    ),
    workContent: state.workContent,
    devProcesses: isOfficeWork ? [] : state.devProcesses,
    deliverables: state.deliverables || null,
    troubles: state.troubles || null,
    goodPoints: state.goodPoints || null,
    condition: state.condition,
    motivation: state.motivation,
    workload: state.workload,
    difficulty: state.difficulty,
    teamConsultability: state.teamConsultability,
    growth: state.growth,
    techStackItems: isOfficeWork ? [] : techStackRecordToItems(state.techStack),
    workAllocations: state.workAllocations
      .filter((row) => row.category.trim() !== "")
      .map((row) => ({ category: row.category.trim(), percentage: toNullableInt(row.percentage) ?? 0 })),
  };
}

export function ReportForm({
  report,
  birthDate,
  engineerStartYear,
  engineerStartMonth,
  workType,
}: {
  report?: ReportWithRelations;
  birthDate: Date | null;
  engineerStartYear: number | null;
  engineerStartMonth: number | null;
  workType: "ENGINEER" | "OFFICE";
}) {
  const devProcessesRequired = workType !== "OFFICE";
  const isOfficeWork = workType === "OFFICE";
  const router = useRouter();
  const isEdit = !!report;
  const [state, setState] = useState<FormState>(() => buildInitialState(report));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const leavingRef = useRef(false);
  const [latestReport, setLatestReport] = useState<ReportWithRelations | null>(null);
  const [latestChecked, setLatestChecked] = useState(false);
  const [carriedOver, setCarriedOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [referenceContent, setReferenceContent] = useState<ReferenceFields>({});

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  // 参考パネルの内容を入力欄へ反映する。空欄ならそのままセット、既に入力
  // があれば消さずに改行区切りで末尾に追記する。
  function copyReference(key: "workContent" | "deliverables" | "troubles" | "goodPoints", value: string) {
    update(key, state[key] ? `${state[key]}\n${value}` : value);
  }

  // 未保存の入力があるままタブを閉じる/リロードする操作にブラウザ標準の
  // 確認ダイアログを出す。保存成功後の画面遷移では出さない。
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      if (leavingRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Load the user's most recent report to (a) suggest the next target month
  // and (b) offer a one-click carry-forward of the stable fields (company,
  // tech stack, project info) into this new report.
  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;

    fetch("/api/reports/latest")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ReportWithRelations | null) => {
        if (cancelled || !data) return;
        setLatestReport(data);
        const next = nextMonthAfter(data.targetYear, data.targetMonth);
        setState((prev) => ({ ...prev, targetYear: next.year, targetMonth: next.month }));
      })
      .finally(() => {
        if (!cancelled) setLatestChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit]);

  // 年齢・経験年数は対象年月と生年月日/エンジニア開始年月から自動計算する
  // 派生値なので、期間(ヶ月数)と同様にstateに持たず描画のたびに計算する
  // （手入力させない）。
  const computedAge = birthDate ? String(calculateAgeAsOf(birthDate, state.targetYear, state.targetMonth)) : "";
  const computedExperienceYears =
    engineerStartYear && engineerStartMonth
      ? String(calculateExperienceYears(engineerStartYear, engineerStartMonth, state.targetYear, state.targetMonth))
      : "";

  const computedPeriodMonths = computeProjectPeriodMonths(
    state.projectPeriodStartYear,
    state.projectPeriodStartMonth,
    state.targetYear,
    state.targetMonth,
  );

  function errorsFor(...keys: string[]): string[] {
    const merged = keys.flatMap((key) => fieldErrors[key] ?? []);
    return [...new Set(merged)];
  }

  function fieldClass(...keys: string[]): string {
    return errorsFor(...keys).length > 0 ? "field has-error" : "field";
  }

  function applyCarryOver() {
    if (!latestReport) return;
    setState((prev) => ({
      ...prev,
      gender: latestReport.gender ?? prev.gender,
      // 年齢・経験年数は前回値を引き継がず、自動計算に任せる。
      clientCompany: latestReport.clientCompany,
      workLocation: latestReport.workLocation,
      projectName: latestReport.projectName,
      projectPeriodStartYear: latestReport.projectPeriodStartYear?.toString() ?? "",
      projectPeriodStartMonth: latestReport.projectPeriodStartMonth?.toString() ?? "",
      projectPeriodOngoing: latestReport.projectPeriodOngoing,
      devProcesses: latestReport.devProcesses,
      techStack: techStackItemsToRecord(latestReport.techStackItems),
      condition: latestReport.condition ?? prev.condition,
      motivation: latestReport.motivation ?? prev.motivation,
      workload: latestReport.workload ?? prev.workload,
      difficulty: latestReport.difficulty ?? prev.difficulty,
      teamConsultability: latestReport.teamConsultability ?? prev.teamConsultability,
      growth: latestReport.growth ?? prev.growth,
      workAllocations: latestReport.workAllocations
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((w) => ({ category: w.category, percentage: String(w.percentage) })),
    }));
    // 作業内容・成果物・困った点・良かった点は自動入力せず、参考表示のみに回す
    // （月ごとに書き直す前提の項目のため）。
    setReferenceContent({
      workContent: latestReport.workContent || undefined,
      deliverables: latestReport.deliverables ?? undefined,
      troubles: latestReport.troubles ?? undefined,
      goodPoints: latestReport.goodPoints ?? undefined,
    });
    setDirty(true);
    setCarriedOver(true);
  }

  async function handleImport(file: File, endpoint: string, defaultErrorMessage: string) {
    setImporting(true);
    setImportError(null);
    setImportWarnings([]);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(endpoint, { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setImportError(data.error ?? defaultErrorMessage);
      setImporting(false);
      return;
    }

    applyParsedFields(data as ParsedReportFields);
    setDirty(true);
    setImportWarnings((data as ParsedReportFields).warnings ?? []);
    setImported(true);
    setImporting(false);
  }

  function handleImportExcel(file: File) {
    return handleImport(file, "/api/reports/import-excel", "Excelの読み込みに失敗しました");
  }

  function applyParsedFields(parsed: ParsedReportFields) {
    setState((prev) => {
      const next = { ...prev };
      // 対象年・対象月は画面表示時点の値（当月 or 前回の翌月）を維持し、
      // Excelに記載の値では上書きしない。
      if (parsed.gender !== undefined) next.gender = parsed.gender;
      // 年齢・経験年数は読み込み元の値を使わず、自動計算に任せる。
      if (parsed.clientCompany !== undefined) next.clientCompany = parsed.clientCompany;
      if (parsed.workLocation !== undefined) next.workLocation = parsed.workLocation;
      // 月間実労働日数・時間・テレワーク日数・現場日数は月ごとに変わるため、
      // 「前回のデータを引き継ぐ」と同様に読み込み元の値をセットしない。
      if (parsed.projectName !== undefined) next.projectName = parsed.projectName;
      if (parsed.projectPeriodStartYear !== undefined) next.projectPeriodStartYear = parsed.projectPeriodStartYear;
      if (parsed.projectPeriodStartMonth !== undefined) next.projectPeriodStartMonth = parsed.projectPeriodStartMonth;
      if (parsed.projectPeriodOngoing !== undefined) next.projectPeriodOngoing = parsed.projectPeriodOngoing;
      if (parsed.projectPeriodEndYear !== undefined) next.projectPeriodEndYear = parsed.projectPeriodEndYear;
      if (parsed.projectPeriodEndMonth !== undefined) next.projectPeriodEndMonth = parsed.projectPeriodEndMonth;
      if (parsed.projectPeriodMonths !== undefined) next.projectPeriodMonths = parsed.projectPeriodMonths;
      if (parsed.devProcesses !== undefined) next.devProcesses = parsed.devProcesses;
      if (parsed.condition !== undefined) next.condition = parsed.condition;
      if (parsed.motivation !== undefined) next.motivation = parsed.motivation;
      if (parsed.workload !== undefined) next.workload = parsed.workload;
      if (parsed.difficulty !== undefined) next.difficulty = parsed.difficulty;
      if (parsed.teamConsultability !== undefined) next.teamConsultability = parsed.teamConsultability;
      if (parsed.growth !== undefined) next.growth = parsed.growth;
      if (parsed.techStack !== undefined) next.techStack = parsed.techStack;
      if (parsed.workAllocations !== undefined) {
        next.workAllocations = parsed.workAllocations.map((w) => ({
          category: w.category,
          percentage: String(w.percentage),
        }));
      }
      return next;
    });
    // 作業内容・成果物・困った点・良かった点は自動入力せず、参考表示のみに回す。
    setReferenceContent({
      workContent: parsed.workContent,
      deliverables: parsed.deliverables,
      troubles: parsed.troubles,
      goodPoints: parsed.goodPoints,
    });
  }

  function handleCancel() {
    if (dirty && !confirm("入力内容が保存されていません。破棄して前の画面に戻りますか？")) {
      return;
    }
    leavingRef.current = true;
    router.back();
  }

  function scrollToFirstError() {
    requestAnimationFrame(() => {
      const el = document.querySelector(".has-error") ?? document.querySelector(".error-banner");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormErrors([]);
    setSubmitError(null);

    const payload = buildPayload(state, computedAge, computedExperienceYears, workType);
    const parsed = buildReportInputSchema(devProcessesRequired).safeParse(payload);
    if (!parsed.success) {
      const nextFieldErrors: Record<string, string[]> = {};
      const nextFormErrors: string[] = [];
      for (const issue of parsed.error.issues) {
        const key = typeof issue.path[0] === "string" ? issue.path[0] : null;
        if (key) (nextFieldErrors[key] ??= []).push(issue.message);
        else nextFormErrors.push(issue.message);
      }
      setFieldErrors(nextFieldErrors);
      setFormErrors(nextFormErrors);
      scrollToFirstError();
      return;
    }

    setSubmitting(true);
    const url = isEdit ? `/api/reports/${report!.id}` : "/api/reports";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data satisfies ReportInput),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSubmitError(data.error ?? "保存に失敗しました");
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const saved = await res.json();
    leavingRef.current = true;
    router.push(`/reports/${saved.id}`);
    router.refresh();
  }

  const hasValidationErrors = Object.keys(fieldErrors).length > 0 || formErrors.length > 0;
  const sectionProps = { state, update, fieldClass, errorsFor };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {(hasValidationErrors || submitError) && (
        <div className="error-banner">
          {submitError && <div>{submitError}</div>}
          {hasValidationErrors && (
            <div>入力内容に誤りがあります。赤く表示された項目を確認してください。</div>
          )}
          {formErrors.length > 0 && (
            <ul style={{ paddingLeft: 18 }}>
              {formErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!isEdit && (
        <ImportAndCarryOverBanner
          latestReport={latestReport}
          latestChecked={latestChecked}
          carriedOver={carriedOver}
          onApplyCarryOver={applyCarryOver}
          importing={importing}
          imported={imported}
          importError={importError}
          importWarnings={importWarnings}
          onImportExcel={handleImportExcel}
        />
      )}

      <BasicInfoSection
        {...sectionProps}
        computedAge={computedAge}
        computedExperienceYears={computedExperienceYears}
        ageAvailable={!!birthDate}
        experienceAvailable={!!(engineerStartYear && engineerStartMonth)}
      />
      <ClientWorkSection {...sectionProps} />
      {!isOfficeWork && <TechStackSection {...sectionProps} />}
      <ProjectSection
        {...sectionProps}
        computedPeriodMonths={computedPeriodMonths}
        workContentReference={referenceContent.workContent}
        onCopyWorkContentReference={() => copyReference("workContent", referenceContent.workContent!)}
        devProcessesRequired={devProcessesRequired}
      />
      <OutcomeSection {...sectionProps} referenceContent={referenceContent} onCopyReference={copyReference} />
      <SelfRatingSection {...sectionProps} />

      <div className="section-title">作業配分</div>
      <div className={fieldClass("workAllocations")} style={{ gap: 10 }}>
        <WorkAllocationEditor rows={state.workAllocations} onChange={(rows) => update("workAllocations", rows)} />
        <FieldErrorText messages={errorsFor("workAllocations")} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={handleCancel}>
          キャンセル
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "保存中..." : "保存する"}
        </button>
      </div>
    </form>
  );
}

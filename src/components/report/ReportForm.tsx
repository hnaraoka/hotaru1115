"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Report, TechStackItem, WorkAllocation } from "@prisma/client";
import { reportInputSchema, type ReportInput } from "@/lib/reportSchema";
import { MONTH_OPTIONS, RATING_FIELDS, RATING_OPTIONS, TECH_CATEGORY_OPTIONS } from "@/lib/constants";
import type { TechCategoryValue } from "@/lib/constants";
import { TagInput } from "@/components/report/TagInput";
import { DevProcessCheckboxes } from "@/components/report/DevProcessCheckboxes";
import { WorkAllocationEditor, type WorkAllocationRow } from "@/components/report/WorkAllocationEditor";
import type { ParsedReportFields } from "@/lib/pdfImport/parseLegacyReport";

type ReportWithRelations = Report & { techStackItems: TechStackItem[]; workAllocations: WorkAllocation[] };

type FormState = {
  submittedAt: string;
  targetYear: number;
  targetMonth: number;
  gender: string;
  age: string;
  experienceYears: string;
  clientCompany: string;
  workLocation: string;
  workDays: string;
  workHours: string;
  teleworkDays: string;
  onsiteDays: string;
  projectName: string;
  projectPeriodStartYear: string;
  projectPeriodStartMonth: string;
  projectPeriodOngoing: boolean;
  projectPeriodEndYear: string;
  projectPeriodEndMonth: string;
  projectPeriodMonths: string;
  workContent: string;
  devProcesses: string[];
  deliverables: string;
  troubles: string;
  goodPoints: string;
  condition: string;
  motivation: string;
  workload: string;
  difficulty: string;
  teamConsultability: string;
  growth: string;
  techStack: Record<TechCategoryValue, string[]>;
  workAllocations: WorkAllocationRow[];
};

function emptyTechStack(): Record<TechCategoryValue, string[]> {
  return {
    LANGUAGE: [],
    FRAMEWORK: [],
    DATABASE: [],
    TOOL: [],
    OS_ENV: [],
  };
}

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
      age: "",
      experienceYears: "",
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

  const techStack = emptyTechStack();
  for (const item of report.techStackItems) {
    techStack[item.category as TechCategoryValue]?.push(item.name);
  }

  return {
    submittedAt: new Date(report.submittedAt).toISOString().slice(0, 10),
    targetYear: report.targetYear,
    targetMonth: report.targetMonth,
    gender: report.gender ?? "",
    age: report.age?.toString() ?? "",
    experienceYears: report.experienceYears?.toString() ?? "",
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
    techStack,
    workAllocations: report.workAllocations
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((w) => ({ category: w.category, percentage: w.percentage })),
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

function buildPayload(state: FormState): unknown {
  const techStackItems = TECH_CATEGORY_OPTIONS.flatMap(({ value }) =>
    state.techStack[value].map((name) => ({ category: value, name })),
  );

  return {
    submittedAt: state.submittedAt,
    targetYear: state.targetYear,
    targetMonth: state.targetMonth,
    gender: state.gender || null,
    age: toNullableInt(state.age),
    experienceYears: toNullableInt(state.experienceYears),
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
    projectPeriodMonths: toNullableInt(state.projectPeriodMonths),
    workContent: state.workContent,
    devProcesses: state.devProcesses,
    deliverables: state.deliverables || null,
    troubles: state.troubles || null,
    goodPoints: state.goodPoints || null,
    condition: state.condition,
    motivation: state.motivation,
    workload: state.workload,
    difficulty: state.difficulty,
    teamConsultability: state.teamConsultability,
    growth: state.growth,
    techStackItems,
    workAllocations: state.workAllocations
      .filter((row) => row.category.trim() !== "")
      .map((row) => ({ category: row.category.trim(), percentage: row.percentage })),
  };
}

export function ReportForm({ report }: { report?: ReportWithRelations }) {
  const router = useRouter();
  const isEdit = !!report;
  const [state, setState] = useState<FormState>(() => buildInitialState(report));
  const [errors, setErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [latestReport, setLatestReport] = useState<ReportWithRelations | null>(null);
  const [latestChecked, setLatestChecked] = useState(false);
  const [carriedOver, setCarriedOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

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

  function applyCarryOver() {
    if (!latestReport) return;
    const techStack = emptyTechStack();
    for (const item of latestReport.techStackItems) {
      techStack[item.category as TechCategoryValue]?.push(item.name);
    }
    setState((prev) => ({
      ...prev,
      gender: latestReport.gender ?? prev.gender,
      age: latestReport.age !== null ? String(latestReport.age) : prev.age,
      experienceYears:
        latestReport.experienceYears !== null ? String(latestReport.experienceYears) : prev.experienceYears,
      clientCompany: latestReport.clientCompany,
      workLocation: latestReport.workLocation,
      projectName: latestReport.projectName,
      projectPeriodStartYear: latestReport.projectPeriodStartYear?.toString() ?? "",
      projectPeriodStartMonth: latestReport.projectPeriodStartMonth?.toString() ?? "",
      projectPeriodOngoing: latestReport.projectPeriodOngoing,
      devProcesses: latestReport.devProcesses,
      techStack,
    }));
    setCarriedOver(true);
  }

  async function handleImportPdf(file: File) {
    setImporting(true);
    setImportError(null);
    setImportWarnings([]);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/reports/import-pdf", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setImportError(data.error ?? "PDFの読み込みに失敗しました");
      setImporting(false);
      return;
    }

    const parsed = data as ParsedReportFields;
    setState((prev) => {
      const next = { ...prev };
      if (parsed.targetYear !== undefined) next.targetYear = parsed.targetYear;
      if (parsed.targetMonth !== undefined) next.targetMonth = parsed.targetMonth;
      if (parsed.gender !== undefined) next.gender = parsed.gender;
      if (parsed.age !== undefined) next.age = parsed.age;
      if (parsed.experienceYears !== undefined) next.experienceYears = parsed.experienceYears;
      if (parsed.clientCompany !== undefined) next.clientCompany = parsed.clientCompany;
      if (parsed.workLocation !== undefined) next.workLocation = parsed.workLocation;
      if (parsed.workDays !== undefined) next.workDays = parsed.workDays;
      if (parsed.workHours !== undefined) next.workHours = parsed.workHours;
      if (parsed.teleworkDays !== undefined) next.teleworkDays = parsed.teleworkDays;
      if (parsed.onsiteDays !== undefined) next.onsiteDays = parsed.onsiteDays;
      if (parsed.projectName !== undefined) next.projectName = parsed.projectName;
      if (parsed.projectPeriodStartYear !== undefined) next.projectPeriodStartYear = parsed.projectPeriodStartYear;
      if (parsed.projectPeriodStartMonth !== undefined) next.projectPeriodStartMonth = parsed.projectPeriodStartMonth;
      if (parsed.projectPeriodOngoing !== undefined) next.projectPeriodOngoing = parsed.projectPeriodOngoing;
      if (parsed.projectPeriodEndYear !== undefined) next.projectPeriodEndYear = parsed.projectPeriodEndYear;
      if (parsed.projectPeriodEndMonth !== undefined) next.projectPeriodEndMonth = parsed.projectPeriodEndMonth;
      if (parsed.projectPeriodMonths !== undefined) next.projectPeriodMonths = parsed.projectPeriodMonths;
      if (parsed.workContent !== undefined) next.workContent = parsed.workContent;
      if (parsed.devProcesses !== undefined) next.devProcesses = parsed.devProcesses;
      if (parsed.deliverables !== undefined) next.deliverables = parsed.deliverables;
      if (parsed.troubles !== undefined) next.troubles = parsed.troubles;
      if (parsed.goodPoints !== undefined) next.goodPoints = parsed.goodPoints;
      if (parsed.condition !== undefined) next.condition = parsed.condition;
      if (parsed.motivation !== undefined) next.motivation = parsed.motivation;
      if (parsed.workload !== undefined) next.workload = parsed.workload;
      if (parsed.difficulty !== undefined) next.difficulty = parsed.difficulty;
      if (parsed.teamConsultability !== undefined) next.teamConsultability = parsed.teamConsultability;
      if (parsed.growth !== undefined) next.growth = parsed.growth;
      if (parsed.techStack !== undefined) next.techStack = parsed.techStack;
      if (parsed.workAllocations !== undefined) next.workAllocations = parsed.workAllocations;
      return next;
    });

    setImportWarnings(parsed.warnings ?? []);
    setImported(true);
    setImporting(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setSubmitError(null);

    const payload = buildPayload(state);
    const parsed = reportInputSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((issue) => issue.message));
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    router.push(`/reports/${saved.id}`);
    router.refresh();
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {(errors.length > 0 || submitError) && (
        <div className="error-banner">
          {submitError && <div>{submitError}</div>}
          {errors.length > 0 && (
            <ul style={{ paddingLeft: 18 }}>
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!isEdit && latestReport && (
        <div className="carry-over-banner">
          <span>
            前回（{latestReport.targetYear}年{latestReport.targetMonth}月分）のデータがあります。
          </span>
          <button type="button" className="btn btn-secondary" onClick={applyCarryOver}>
            前回のデータを引き継ぐ
          </button>
          {carriedOver && <span className="carry-over-done">引き継ぎました</span>}
        </div>
      )}
      {!isEdit && latestChecked && !latestReport && (
        <div className="carry-over-banner">
          <span>引き継げる過去の報告書はありません（今回が初回作成です）。</span>
        </div>
      )}

      {!isEdit && (
        <div className="carry-over-banner">
          <span>過去に作成したExcel由来のPDF帳票があれば、読み込んでフォームに自動入力できます。</span>
          <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
            {importing ? "読み込み中..." : "PDFから読み込む"}
            <input
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) handleImportPdf(file);
              }}
            />
          </label>
          {imported && !importError && <span className="carry-over-done">読み込みました</span>}
        </div>
      )}
      {importError && <div className="error-banner">{importError}</div>}
      {importWarnings.length > 0 && (
        <div className="error-banner" style={{ color: "#92400e", background: "#fef3c7", borderColor: "#fbbf24" }}>
          <ul style={{ paddingLeft: 18 }}>
            {importWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          <div>読み込んだ内容は必ずご確認・修正のうえ保存してください。</div>
        </div>
      )}

      <div className="section-title" style={{ borderTop: "none", paddingTop: 0 }}>
        基本情報
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="submittedAt">提出日 *</label>
          <input
            id="submittedAt"
            type="date"
            value={state.submittedAt}
            onChange={(e) => update("submittedAt", e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="targetYear">対象年 *</label>
          <input
            id="targetYear"
            type="number"
            value={state.targetYear}
            onChange={(e) => update("targetYear", Number(e.target.value))}
            required
          />
        </div>
        <div className="field">
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
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="gender">性別</label>
          <input id="gender" value={state.gender} onChange={(e) => update("gender", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="age">年齢</label>
          <input id="age" type="number" value={state.age} onChange={(e) => update("age", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="experienceYears">経験年数</label>
          <input
            id="experienceYears"
            type="number"
            value={state.experienceYears}
            onChange={(e) => update("experienceYears", e.target.value)}
          />
        </div>
      </div>

      <div className="section-title">参画先・勤務</div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="clientCompany">参画先企業 *</label>
          <input
            id="clientCompany"
            value={state.clientCompany}
            onChange={(e) => update("clientCompany", e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="workLocation">作業場所 *</label>
          <input
            id="workLocation"
            value={state.workLocation}
            onChange={(e) => update("workLocation", e.target.value)}
            required
            placeholder="例: 江戸川橋/在宅"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="workDays">月間実労働日数</label>
          <input
            id="workDays"
            type="number"
            value={state.workDays}
            onChange={(e) => update("workDays", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="workHours">月間実労働時間</label>
          <input
            id="workHours"
            type="number"
            step="0.5"
            value={state.workHours}
            onChange={(e) => update("workHours", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="teleworkDays">テレワーク日数</label>
          <input
            id="teleworkDays"
            type="number"
            value={state.teleworkDays}
            onChange={(e) => update("teleworkDays", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="onsiteDays">現場日数</label>
          <input
            id="onsiteDays"
            type="number"
            value={state.onsiteDays}
            onChange={(e) => update("onsiteDays", e.target.value)}
          />
        </div>
      </div>

      <div className="section-title">技術スタック</div>
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

      <div className="section-title">プロジェクト</div>
      <div className="field">
        <label htmlFor="projectName">プロジェクト名 *</label>
        <input
          id="projectName"
          value={state.projectName}
          onChange={(e) => update("projectName", e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <div className="field">
          <label>期間開始</label>
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
        </div>
        <div className="field">
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
          <div className="field">
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
          </div>
        )}
        <div className="field">
          <label htmlFor="projectPeriodMonths">期間(ヶ月数)</label>
          <input
            id="projectPeriodMonths"
            type="number"
            value={state.projectPeriodMonths}
            onChange={(e) => update("projectPeriodMonths", e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="workContent">作業内容 *</label>
        <textarea
          id="workContent"
          value={state.workContent}
          onChange={(e) => update("workContent", e.target.value)}
          required
          placeholder="箇条書きで入力してください"
          style={{ minHeight: 120 }}
        />
      </div>

      <div className="field">
        <label>開発工程 *</label>
        <DevProcessCheckboxes
          selected={state.devProcesses}
          onChange={(v) => update("devProcesses", v)}
        />
      </div>

      <div className="section-title">成果物・所感</div>
      <div className="field">
        <label htmlFor="deliverables">成果物</label>
        <textarea
          id="deliverables"
          value={state.deliverables}
          onChange={(e) => update("deliverables", e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="troubles">今月の困った点と対応・解決方法</label>
        <textarea
          id="troubles"
          value={state.troubles}
          onChange={(e) => update("troubles", e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="goodPoints">今月の良かった点/改善提案など</label>
        <textarea
          id="goodPoints"
          value={state.goodPoints}
          onChange={(e) => update("goodPoints", e.target.value)}
        />
      </div>

      <div className="section-title">自己評価</div>
      <div className="form-row">
        {RATING_FIELDS.map(({ key, label }) => (
          <div className="field" key={key}>
            <label htmlFor={key}>{label} *</label>
            <select
              id={key}
              value={state[key]}
              onChange={(e) => update(key, e.target.value)}
              required
            >
              <option value="" disabled>
                選択してください
              </option>
              {RATING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="section-title">作業配分</div>
      <WorkAllocationEditor
        rows={state.workAllocations}
        onChange={(rows) => update("workAllocations", rows)}
      />

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
          キャンセル
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "保存中..." : "保存する"}
        </button>
      </div>
    </form>
  );
}

import type { TechCategoryValue } from "@/lib/constants";
import type { WorkAllocationRow } from "@/components/report/WorkAllocationEditor";

export type FormState = {
  submittedAt: string;
  targetYear: number;
  targetMonth: number;
  gender: string;
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

export type ReferenceFields = {
  workContent?: string;
  deliverables?: string;
  troubles?: string;
  goodPoints?: string;
};

/** Shared plumbing every form-section subcomponent needs to read/update the parent's form state. */
export type SectionProps = {
  state: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  fieldClass: (...keys: string[]) => string;
  errorsFor: (...keys: string[]) => string[];
};

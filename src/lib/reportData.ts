import type { Prisma, TechCategory, RatingLevel } from "@prisma/client";
import type { ReportInput } from "@/lib/reportSchema";

function scalarFields(input: ReportInput) {
  return {
    submittedAt: new Date(input.submittedAt),
    targetYear: input.targetYear,
    targetMonth: input.targetMonth,
    gender: input.gender ?? null,
    age: input.age ?? null,
    experienceYears: input.experienceYears ?? null,
    clientCompany: input.clientCompany,
    workLocation: input.workLocation,
    workDays: input.workDays ?? null,
    workHours: input.workHours ?? null,
    teleworkDays: input.teleworkDays ?? null,
    onsiteDays: input.onsiteDays ?? null,
    projectName: input.projectName,
    projectPeriodStartYear: input.projectPeriodStartYear ?? null,
    projectPeriodStartMonth: input.projectPeriodStartMonth ?? null,
    projectPeriodOngoing: input.projectPeriodOngoing,
    projectPeriodEndYear: input.projectPeriodOngoing ? null : input.projectPeriodEndYear ?? null,
    projectPeriodEndMonth: input.projectPeriodOngoing ? null : input.projectPeriodEndMonth ?? null,
    projectPeriodMonths: input.projectPeriodMonths ?? null,
    workContent: input.workContent,
    devProcesses: input.devProcesses,
    deliverables: input.deliverables ?? null,
    troubles: input.troubles ?? null,
    goodPoints: input.goodPoints ?? null,
    condition: input.condition as RatingLevel,
    motivation: input.motivation as RatingLevel,
    workload: input.workload as RatingLevel,
    difficulty: input.difficulty as RatingLevel,
    teamConsultability: input.teamConsultability as RatingLevel,
    growth: input.growth as RatingLevel,
  };
}

export function toReportCreateData(input: ReportInput, userId: string): Prisma.ReportCreateInput {
  return {
    ...scalarFields(input),
    user: { connect: { id: userId } },
    techStackItems: {
      create: input.techStackItems.map((item, index) => ({
        category: item.category as TechCategory,
        name: item.name,
        sortOrder: index,
      })),
    },
    workAllocations: {
      create: input.workAllocations.map((item, index) => ({
        category: item.category,
        percentage: item.percentage,
        sortOrder: index,
      })),
    },
  };
}

export function toReportUpdateData(input: ReportInput): Prisma.ReportUpdateInput {
  return {
    ...scalarFields(input),
    techStackItems: {
      deleteMany: {},
      create: input.techStackItems.map((item, index) => ({
        category: item.category as TechCategory,
        name: item.name,
        sortOrder: index,
      })),
    },
    workAllocations: {
      deleteMany: {},
      create: input.workAllocations.map((item, index) => ({
        category: item.category,
        percentage: item.percentage,
        sortOrder: index,
      })),
    },
  };
}

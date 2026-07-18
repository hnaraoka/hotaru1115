import { z } from "zod";
import { DEV_PROCESS_OPTIONS, RATING_OPTIONS, TECH_CATEGORY_OPTIONS } from "@/lib/constants";

const techCategoryValues = TECH_CATEGORY_OPTIONS.map((c) => c.value) as [string, ...string[]];
const ratingValues = RATING_OPTIONS.map((r) => r.value) as [string, ...string[]];
const devProcessValues = DEV_PROCESS_OPTIONS as unknown as [string, ...string[]];

const techStackItemSchema = z.object({
  category: z.enum(techCategoryValues),
  name: z.string().trim().min(1, "技術スタックの項目名を入力してください"),
});

const workAllocationItemSchema = z.object({
  category: z.string().trim().min(1, "作業配分の項目名を入力してください"),
  percentage: z.number().int().min(1, "作業配分は1%以上で入力してください").max(100),
});

export const reportInputSchema = z
  .object({
    submittedAt: z.string().min(1, "提出日は必須です"),
    targetYear: z.number().int().min(2000).max(2100),
    targetMonth: z.number().int().min(1).max(12),

    gender: z.string().trim().optional().nullable(),
    age: z.number().int().min(0).max(120).optional().nullable(),
    experienceYears: z.number().int().min(0).max(80).optional().nullable(),

    clientCompany: z.string().trim().min(1, "参画先企業は必須です").max(200, "参画先企業は200文字以内で入力してください"),
    workLocation: z.string().trim().min(1, "作業場所は必須です").max(200, "作業場所は200文字以内で入力してください"),

    workDays: z
      .number({ message: "月間実労働日数は必須です" })
      .int()
      .min(0)
      .max(31),
    workHours: z
      .number({ message: "月間実労働時間は必須です" })
      .min(0)
      .max(500),
    teleworkDays: z
      .number({ message: "テレワーク日数は必須です" })
      .int()
      .min(0)
      .max(31),
    onsiteDays: z
      .number({ message: "現場日数は必須です" })
      .int()
      .min(0)
      .max(31),

    projectName: z.string().trim().min(1, "プロジェクト名は必須です").max(200, "プロジェクト名は200文字以内で入力してください"),
    projectPeriodStartYear: z.number().int().min(2000).max(2100).optional().nullable(),
    projectPeriodStartMonth: z.number().int().min(1).max(12).optional().nullable(),
    projectPeriodOngoing: z.boolean(),
    projectPeriodEndYear: z.number().int().min(2000).max(2100).optional().nullable(),
    projectPeriodEndMonth: z.number().int().min(1).max(12).optional().nullable(),
    projectPeriodMonths: z.number().int().min(0).max(999).optional().nullable(),

    workContent: z
      .string()
      .trim()
      .min(1, "作業内容は必須です")
      .max(2000, "作業内容は2000文字以内で入力してください"),
    devProcesses: z.array(z.enum(devProcessValues)).min(1, "開発工程を1つ以上選択してください"),

    deliverables: z.string().trim().max(1000, "成果物は1000文字以内で入力してください").optional().nullable(),
    troubles: z
      .string()
      .trim()
      .max(1000, "今月の困った点と対応・解決方法は1000文字以内で入力してください")
      .optional()
      .nullable(),
    goodPoints: z
      .string()
      .trim()
      .max(1000, "今月の良かった点/改善提案などは1000文字以内で入力してください")
      .optional()
      .nullable(),

    condition: z.enum(ratingValues, { message: "体調を選択してください" }),
    motivation: z.enum(ratingValues, { message: "モチベーションを選択してください" }),
    workload: z.enum(ratingValues, { message: "業務量を選択してください" }),
    difficulty: z.enum(ratingValues, { message: "業務難易度を選択してください" }),
    teamConsultability: z.enum(ratingValues, { message: "チーム内の相談しやすさを選択してください" }),
    growth: z.enum(ratingValues, { message: "成長実感を選択してください" }),

    techStackItems: z.array(techStackItemSchema).default([]),
    workAllocations: z.array(workAllocationItemSchema).min(1, "作業配分を1つ以上入力してください"),
  })
  .superRefine((data, ctx) => {
    const total = data.workAllocations.reduce((sum, item) => sum + item.percentage, 0);
    if (total !== 100) {
      ctx.addIssue({
        code: "custom",
        path: ["workAllocations"],
        message: `作業配分の合計は100%にしてください（現在: ${total}%）`,
      });
    }

    if (data.workDays !== data.teleworkDays + data.onsiteDays) {
      ctx.addIssue({
        code: "custom",
        path: ["workDays"],
        message: `月間実労働日数はテレワーク日数と現場日数の合計と一致させてください（現在: 実労働${data.workDays}日 / テレワーク${data.teleworkDays}日 + 現場${data.onsiteDays}日 = ${data.teleworkDays + data.onsiteDays}日）`,
      });
    }

    if (!data.projectPeriodOngoing) {
      if (!data.projectPeriodEndYear || !data.projectPeriodEndMonth) {
        ctx.addIssue({
          code: "custom",
          path: ["projectPeriodEndYear"],
          message: "継続中でない場合は終了年月を入力してください",
        });
      }
    }
  });

export type ReportInput = z.infer<typeof reportInputSchema>;

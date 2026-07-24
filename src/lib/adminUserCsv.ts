import { WORK_TYPE_OPTIONS } from "@/lib/constants";

// CSV一括登録のテンプレート/プレビューと、既存ユーザーのCSV出力の両方で
// 同じ列順を使うための共通定義。
export const USER_CSV_HEADER = ["ログインID", "氏名", "生年月日", "業務", "メールアドレス", "権限"] as const;

const ROLE_CSV_LABEL: Record<"ADMIN" | "USER", string> = { ADMIN: "管理者", USER: "一般" };
const WORK_TYPE_CSV_LABEL: Record<"ENGINEER" | "OFFICE", string> = Object.fromEntries(
  WORK_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<"ENGINEER" | "OFFICE", string>;

export type ExportableUser = {
  loginId: string;
  name: string;
  birthDate: Date | null;
  workType: "ENGINEER" | "OFFICE";
  email: string | null;
  role: "ADMIN" | "USER";
};

export function userToCsvRow(user: ExportableUser): string[] {
  return [
    user.loginId,
    user.name,
    user.birthDate ? user.birthDate.toISOString().slice(0, 10) : "",
    WORK_TYPE_CSV_LABEL[user.workType],
    user.email ?? "",
    ROLE_CSV_LABEL[user.role],
  ];
}

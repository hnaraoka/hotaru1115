import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

const resendApiKey = process.env.RESEND_API_KEY;
const notifyFromAddress = process.env.NOTIFY_FROM_EMAIL ?? "onboarding@resend.dev";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function notifyFailedLogin(user: User) {
  const message = `${user.name}さん（ID: ${user.loginId}）のログインが3回連続で失敗しました。`;

  await prisma.notification.create({
    data: { message, relatedUserId: user.id },
  });

  if (!resend) {
    console.warn("RESEND_API_KEY が未設定のため、ログイン失敗のメール通知はスキップされました。");
    return;
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true, email: { not: null } },
  });

  const recipients = admins.map((admin) => admin.email).filter((email): email is string => !!email);
  if (recipients.length === 0) return;

  try {
    await resend.emails.send({
      from: notifyFromAddress,
      to: recipients,
      subject: "【月次報告書アプリ】ログイン失敗の通知",
      text: `${message}\n\nアカウントの状態を管理画面から確認してください。`,
    });
  } catch (error) {
    console.error("ログイン失敗通知メールの送信に失敗しました", error);
  }
}

export async function notifySubmissionReminder(
  user: Pick<User, "loginId" | "name" | "email">,
  targetYear: number,
  targetMonth: number,
): Promise<boolean> {
  if (!resend) {
    console.warn("RESEND_API_KEY が未設定のため、提出リマインドのメール送信はスキップされました。");
    return false;
  }
  if (!user.email) return false;

  try {
    await resend.emails.send({
      from: notifyFromAddress,
      to: user.email,
      subject: `【月次報告書アプリ】${targetYear}年${targetMonth}月分の提出リマインド`,
      text: `${user.name}さん\n\n${targetYear}年${targetMonth}月分の月次報告書がまだ提出されていません。\nお手数ですが、アプリにログインのうえ作成・提出をお願いします。\n\nログインID: ${user.loginId}\n\n※すでに提出済みの場合は行き違いですのでご容赦ください。`,
    });
    return true;
  } catch (error) {
    console.error(`提出リマインドメールの送信に失敗しました (${user.loginId})`, error);
    return false;
  }
}

export async function notifyRevisionRequested(
  user: Pick<User, "loginId" | "name" | "email">,
  targetYear: number,
  targetMonth: number,
  comment: string,
) {
  if (!resend) {
    console.warn("RESEND_API_KEY が未設定のため、差し戻し通知のメール送信はスキップされました。");
    return;
  }
  if (!user.email) return;

  try {
    await resend.emails.send({
      from: notifyFromAddress,
      to: user.email,
      subject: `【月次報告書アプリ】${targetYear}年${targetMonth}月分の報告書に指摘があります`,
      text: `${user.name}さん\n\n${targetYear}年${targetMonth}月分の月次報告書について、管理者より指摘がありました。\n\n${comment}\n\nアプリにログインし、内容を修正のうえ再度保存してください。`,
    });
  } catch (error) {
    console.error(`差し戻し通知メールの送信に失敗しました (${user.loginId})`, error);
  }
}

export async function notifyPasswordReset(
  user: Pick<User, "loginId" | "name" | "email">,
  newPassword: string,
) {
  if (!resend) {
    console.warn("RESEND_API_KEY が未設定のため、パスワード変更のメール通知はスキップされました。");
    return;
  }

  if (!user.email) {
    console.warn(`${user.loginId} にメールアドレスが未設定のため、パスワード変更通知をスキップしました。`);
    return;
  }

  try {
    await resend.emails.send({
      from: notifyFromAddress,
      to: user.email,
      subject: "【月次報告書アプリ】パスワードが変更されました",
      text: `${user.name}さん\n\n管理者によりログインパスワードが変更されました。\n\nログインID: ${user.loginId}\n新しいパスワード: ${newPassword}\n\n次回ログイン後、必要であればパスワードを変更してください。`,
    });
  } catch (error) {
    console.error("パスワード変更通知メールの送信に失敗しました", error);
  }
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NotificationList } from "@/components/admin/NotificationList";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { relatedUser: { select: { name: true, loginId: true } } },
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>管理者ダッシュボード</h1>
          <p>ユーザー管理や通知を確認できます。</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/admin/status" className="btn btn-secondary">
            提出状況を見る
          </Link>
          <Link href="/admin/users" className="btn btn-primary">
            ユーザー管理へ
          </Link>
        </div>
      </div>

      <div className="section-title" style={{ borderTop: "none", paddingTop: 0 }}>
        通知
      </div>
      <NotificationList
        notifications={notifications.map((n) => ({
          id: n.id,
          message: n.message,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
          relatedUserName: n.relatedUser?.name ?? null,
        }))}
      />
    </>
  );
}

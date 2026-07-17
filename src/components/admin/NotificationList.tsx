"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type NotificationItem = {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedUserName: string | null;
};

export function NotificationList({ notifications }: { notifications: NotificationItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (notifications.length === 0) {
    return <p style={{ color: "var(--muted)", fontSize: 14 }}>通知はありません。</p>;
  }

  async function markAsRead(id: string) {
    setPendingId(id);
    await fetch(`/api/admin/notifications/${id}`, { method: "PATCH" });
    router.refresh();
    setPendingId(null);
  }

  return (
    <ul className="report-list">
      {notifications.map((n) => (
        <li key={n.id} className="report-item" style={{ opacity: n.isRead ? 0.6 : 1 }}>
          <div className="report-item-top">
            <span className="report-item-title">{n.message}</span>
            {!n.isRead && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={pendingId === n.id}
                onClick={() => markAsRead(n.id)}
              >
                既読にする
              </button>
            )}
          </div>
          <div className="report-item-meta">
            <span>{new Date(n.createdAt).toLocaleString("ja-JP")}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

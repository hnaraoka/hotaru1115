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
  const [bulkPending, setBulkPending] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.length - unreadCount;

  if (notifications.length === 0) {
    return <p style={{ color: "var(--muted)", fontSize: 14 }}>通知はありません。</p>;
  }

  async function markAsRead(id: string) {
    setPendingId(id);
    await fetch(`/api/admin/notifications/${id}`, { method: "PATCH" });
    router.refresh();
    setPendingId(null);
  }

  async function deleteOne(id: string) {
    if (!confirm("この通知を削除しますか？")) return;
    setPendingId(id);
    await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" });
    router.refresh();
    setPendingId(null);
  }

  async function markAllAsRead() {
    setBulkPending(true);
    await fetch("/api/admin/notifications", { method: "PATCH" });
    router.refresh();
    setBulkPending(false);
  }

  async function deleteAllRead() {
    if (!confirm(`既読の通知${readCount}件をすべて削除しますか？`)) return;
    setBulkPending(true);
    await fetch("/api/admin/notifications", { method: "DELETE" });
    router.refresh();
    setBulkPending(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={bulkPending || unreadCount === 0}
          onClick={markAllAsRead}
        >
          すべて既読にする{unreadCount > 0 ? `（${unreadCount}件）` : ""}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={bulkPending || readCount === 0}
          onClick={deleteAllRead}
        >
          既読を一括削除{readCount > 0 ? `（${readCount}件）` : ""}
        </button>
      </div>

      <ul className="report-list">
        {notifications.map((n) => (
          <li key={n.id} className="report-item" style={{ opacity: n.isRead ? 0.6 : 1 }}>
            <div className="report-item-top">
              <span className="report-item-title">{n.message}</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={pendingId === n.id}
                  onClick={() => deleteOne(n.id)}
                >
                  削除
                </button>
              </div>
            </div>
            <div className="report-item-meta">
              <span>{new Date(n.createdAt).toLocaleString("ja-JP")}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

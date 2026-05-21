"use client";
import { useState, useEffect, useRef } from "react";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

const typeIcon: Record<string, string> = {
  info: "ℹ️", warning: "⚠️", success: "✅", error: "❌",
};

export default function NotificationBell({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    setLoading(true);
    const res = await fetch(`/api/site/${slug}/notifications?limit=20`);
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications);
      setUnread(data.unreadCount);
    }
    setLoading(false);
  }

  async function markAllRead() {
    await fetch(`/api/site/${slug}/notifications`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [slug]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleOpen() {
    setOpen((v) => !v);
    if (!open) fetchNotifications();
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-sm text-gray-900">Notificaciones</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading && notifications.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">Cargando...</p>
            )}
            {!loading && notifications.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">No hay notificaciones</p>
            )}
            {notifications.map((n) => (
              <div key={n.id}
                className={`px-4 py-3 flex gap-3 transition-colors ${n.isRead ? "bg-white" : "bg-blue-50"} hover:bg-gray-50`}>
                <span className="text-lg flex-shrink-0 mt-0.5">{typeIcon[n.type] ?? "ℹ️"}</span>
                <div className="min-w-0">
                  <p className={`text-sm ${n.isRead ? "text-gray-700" : "text-gray-900 font-medium"}`}>{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

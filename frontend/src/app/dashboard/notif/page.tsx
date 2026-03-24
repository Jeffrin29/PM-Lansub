"use client";

import { useState, useEffect, useCallback } from "react";
import { notificationsApi } from "../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Notification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  priority?: string;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const typeConfig: Record<string, { icon: string; color: string }> = {
  task_assigned:   { icon: "📌", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
  deadline:        { icon: "⏰", color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  project_updated: { icon: "📁", color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" },
  mention:         { icon: "@",  color: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400" },
  system:          { icon: "⚙️", color: "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400" },
  assignment:      { icon: "📌", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
  completion:      { icon: "✅", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
  update:          { icon: "🔔", color: "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter,        setFilter]        = useState<"all" | "unread">("all");
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsApi.getAll();
      setNotifications(res?.data?.data || res?.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered     = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount  = notifications.filter((n) => !n.read).length;

  async function markRead(id: string) {
    try {
      await notificationsApi.markRead(id);
    } catch (_) {}
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      for (const n of notifications.filter((n) => !n.read)) {
        await notificationsApi.markRead(n._id);
      }
    } catch (_) {}
  }

  async function deleteNotif(id: string) {
    try {
      await notificationsApi.remove(id);
    } catch (_) {}
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm font-medium bg-blue-600 text-white px-2.5 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Stay up-to-date with your workspace
          </p>
        </div>
        <div className="flex gap-2">
          <button
            id="mark-all-read-btn"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition disabled:opacity-50"
          >
            Mark all read
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl">
          ⚠️ {error}
          <button onClick={fetchData} className="ml-3 underline text-xs">Retry</button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            id={`notif-filter-${f}`}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
              filter === f
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
            }`}
          >
            {f === "all" ? "All" : "Unread"}{" "}
            {f === "all" ? `(${notifications.length})` : `(${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50 dark:divide-zinc-800">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading notifications…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <span className="text-4xl block mb-2">🔔</span>
            <p className="text-sm">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
          </div>
        ) : (
          filtered.map((notif) => {
            const cfg = typeConfig[notif.type] || typeConfig.system;
            return (
              <div
                key={notif._id}
                className={`flex items-start gap-4 p-5 transition group ${
                  !notif.read
                    ? "bg-blue-50/50 dark:bg-blue-900/10"
                    : "hover:bg-gray-50 dark:hover:bg-zinc-800/40"
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 font-bold ${cfg.color}`}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <p className={`text-sm ${!notif.read ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                      {notif.message}
                    </p>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(notif.createdAt)}</span>
                    {notif.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        notif.priority === "high"   ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                        notif.priority === "medium" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                        "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400"
                      }`}>
                        {notif.priority}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                  {!notif.read && (
                    <button
                      id={`mark-read-${notif._id}`}
                      onClick={() => markRead(notif._id)}
                      title="Mark as read"
                      className="w-8 h-8 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 flex items-center justify-center text-blue-500 transition text-xs"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    id={`delete-notif-${notif._id}`}
                    onClick={() => deleteNotif(notif._id)}
                    title="Delete"
                    className="w-8 h-8 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center text-red-400 transition text-sm"
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
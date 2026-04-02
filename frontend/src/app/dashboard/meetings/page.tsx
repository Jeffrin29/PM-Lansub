"use client";

import { useState, useEffect, useCallback } from "react";
import { meetingsApi } from "../../../lib/api";
import { useCurrentUser } from "../../../hooks/useCurrentUser";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Meeting {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  meetingLink: string | null;
  status: "scheduled" | "cancelled" | "completed";
  createdBy?: { _id: string; name: string; email: string };
  participants?: { _id: string; name: string; email: string }[];
}

// ── Helper ─────────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    completed:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    cancelled:  "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${map[status] || ""}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Schedule Meeting Modal ─────────────────────────────────────────────────────
function ScheduleModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: "", description: "", date: "", time: "",
    meetingLink: "", participantEmails: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.date)          { setError("Date is required");  return; }
    if (!form.time)          { setError("Time is required");  return; }
    setSaving(true);
    try {
      await onSave({
        title:       form.title,
        description: form.description,
        date:        form.date,
        time:        form.time,
        meetingLink: form.meetingLink || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to schedule");
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Schedule Meeting</h2>
          <button
            id="close-meeting-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-500 transition"
          >✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input
              type="text" placeholder="Meeting title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={field}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              rows={2} placeholder="What is this meeting about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${field} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
              <input
                type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time *</label>
              <input
                type="time" value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className={field}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meeting Link
              <span className="ml-1 text-xs text-gray-400 font-normal">(Teams, Zoom, Google Meet…)</span>
            </label>
            <input
              type="url" placeholder="https://…"
              value={form.meetingLink}
              onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
              className={field}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
            >Cancel</button>
            <button
              id="submit-meeting-btn"
              type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-60"
            >{saving ? "Scheduling…" : "Schedule Meeting"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function MeetingsPage() {
  const { role } = useCurrentUser();
  const canSchedule = ["admin", "project_manager", "hr"].includes(role);

  const [meetings,   setMeetings]   = useState<Meeting[]>([]);
  const [showModal,  setShowModal]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [filter,     setFilter]     = useState<"all" | "scheduled" | "completed" | "cancelled">("all");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await meetingsApi.getAll();
      setMeetings(res?.data || res?.data?.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleCreate(data: any) {
    await meetingsApi.create(data);
    await fetchAll();
  }

  const filtered = filter === "all"
    ? meetings
    : meetings.filter((m) => m.status === filter);

  const scheduledCount = meetings.filter((m) => m.status === "scheduled").length;
  const upcomingToday  = meetings.filter((m) => {
    const d = new Date(m.date);
    const today = new Date();
    return d.toDateString() === today.toDateString() && m.status === "scheduled";
  }).length;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // For the grouped view: upcoming = today or future; past = before today
  const upcomingMeetings = filtered.filter((m) => new Date(m.date) >= now);
  const pastMeetings     = filtered.filter((m) => new Date(m.date) < now);
  const showGrouped      = filter === "all" || filter === "scheduled";

  return (
    <div className="space-y-8 pb-8">
      {showModal && (
        <ScheduleModal
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meetings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Schedule and manage team meetings
          </p>
        </div>
        {canSchedule && (
          <button
            id="schedule-meeting-btn"
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md transition"
          >
            ＋ Schedule Meeting
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl">
          ⚠️ {error}
          <button onClick={fetchAll} className="ml-3 underline text-xs">Retry</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Scheduled",    value: scheduledCount,         color: "text-blue-600"    },
          { label: "Today",        value: upcomingToday,          color: "text-amber-500"   },
          { label: "Total",        value: meetings.length,        color: "text-gray-700 dark:text-gray-200" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "scheduled", "completed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            id={`meeting-filter-${f}`}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === f
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Meeting cards */}
      {loading ? (
        <div className="flex items-center justify-center py-14 text-gray-400 gap-2">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading meetings…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-16 text-center shadow-sm">
          <span className="text-4xl mb-3 block">📅</span>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {filter === "all" ? "No meetings scheduled yet" : `No ${filter} meetings`}
          </p>
          {canSchedule && filter === "all" && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
            >
              Schedule your first meeting
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming */}
          {upcomingMeetings.length > 0 && (
            <div>
              {showGrouped && (
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  Upcoming ({upcomingMeetings.length})
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMeetings.map((m) => (
                  <MeetingCard key={m._id} m={m} />
                ))}
              </div>
            </div>
          )}
          {/* Past */}
          {showGrouped && pastMeetings.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                Past ({pastMeetings.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
                {pastMeetings.map((m) => (
                  <MeetingCard key={m._id} m={m} />
                ))}
              </div>
            </div>
          )}
          {/* Non-grouped (completed / cancelled filter) */}
          {!showGrouped && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((m) => (
                <MeetingCard key={m._id} m={m} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MeetingCard extracted for reuse ───────────────────────────────────────────
function MeetingCard({ m }: { m: Meeting }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition group">
      {/* Card header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug group-hover:text-blue-600 transition">
          {m.title}
        </h3>
        <StatusBadge status={m.status} />
      </div>

      {/* Description */}
      {m.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
          {m.description}
        </p>
      )}

      {/* Date & Time */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
        <span className="text-sm">📅</span>
        <span>{formatDate(m.date)}</span>
        <span className="text-gray-300 dark:text-zinc-600">·</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">{m.time}</span>
      </div>

      {/* Creator */}
      {m.createdBy && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
            {m.createdBy.name.charAt(0)}
          </div>
          <span>by {m.createdBy.name}</span>
        </div>
      )}

      {/* Participants */}
      {m.participants && m.participants.length > 0 && (
        <div className="flex items-center gap-1 mb-3">
          {m.participants.slice(0, 4).map((p) => (
            <div
              key={p._id}
              title={p.name}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white text-[9px] font-bold border-2 border-white dark:border-zinc-900 -ml-1 first:ml-0"
            >
              {p.name.charAt(0)}
            </div>
          ))}
          {m.participants.length > 4 && (
            <span className="text-[10px] text-gray-400 ml-1">+{m.participants.length - 4}</span>
          )}
        </div>
      )}

      {/* Join link */}
      {m.meetingLink && m.status === "scheduled" && (
        <a
          href={m.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          id={`join-meeting-${m._id}`}
          className="mt-1 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Join Meeting
        </a>
      )}
    </div>
  );
}


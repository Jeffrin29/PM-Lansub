"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { timesheetsApi, projectsApi, tasksApi } from "../../../lib/api";
import { useCurrentUser } from "../../../hooks/useCurrentUser";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Timesheet {
  _id: string;
  date: string;
  userId?: { _id: string; name: string; email: string };
  taskId?: { title: string };
  projectId?: { projectTitle: string };
  hours: number;
  billingType: "billable" | "non-billable" | "internal";
  status: "pending" | "approved" | "rejected";
  notes: string;
}
interface Project { _id: string; projectTitle: string }
interface Task    { _id: string; title: string }

// ── Billing tooltip map ───────────────────────────────────────────────────────
const BILLING_TIPS: Record<string, string> = {
  billable:      "Client chargeable work",
  "non-billable": "Non-billable work",
  internal:      "Non-billable work (internal)",
};

// ── Components ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${styles[status] || ""}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function BillingBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    billable:       "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    "non-billable": "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400",
    internal:       "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
  };
  const tip = BILLING_TIPS[type] || type;
  return (
    <span
      title={tip}
      className={`text-xs px-2.5 py-1 rounded-full font-medium cursor-help ${styles[type] || ""}`}
    >
      {type.charAt(0).toUpperCase() + type.slice(1).replace("-", "‑")}
    </span>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="w-4 h-4 rounded-full bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 text-[10px] font-bold flex items-center justify-center"
        tabIndex={-1}
      >
        ?
      </button>
      {show && (
        <span className="absolute left-5 top-0 z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-xl pointer-events-none">
          {text}
        </span>
      )}
    </span>
  );
}

// ── Time Entry Modal ──────────────────────────────────────────────────────────
function TimeEntryModal({
  onClose, onSave, projects, tasks,
}: {
  onClose: () => void;
  onSave:  (data: Partial<Timesheet>) => Promise<void>;
  projects: Project[];
  tasks:    Task[];
}) {
  const [form, setForm] = useState({
    taskId:      "",
    projectId:   "",
    hours:       "",
    billingType: "billable",
    notes:       "",
    date:        new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.projectId)                           { setError("Project is required"); return; }
    if (!form.hours || parseFloat(form.hours) <= 0) { setError("Enter valid hours");   return; }
    setSaving(true);
    try {
      await onSave({ ...form, hours: parseFloat(form.hours) } as any);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Log Time</h2>
          <button
            id="close-timesheet-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-500 transition"
          >✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project *</label>
            <select
              id="ts-project-select"
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select project…</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.projectTitle}</option>
              ))}
            </select>
          </div>

          {/* Task */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task</label>
            <select
              id="ts-task-select"
              value={form.taskId}
              onChange={(e) => setForm({ ...form, taskId: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select task (optional)…</option>
              {tasks.map((t) => (
                <option key={t._id} value={t._id}>{t.title}</option>
              ))}
            </select>
          </div>

          {/* Hours + Billing Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hours *</label>
              <input
                type="number" min="0.1" max="24" step="0.25"
                placeholder="e.g. 2.5"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 items-center flex">
                Billing Type
                <InfoTooltip text={BILLING_TIPS[form.billingType] || ""} />
              </label>
              <select
                id="ts-billing-select"
                value={form.billingType}
                onChange={(e) => setForm({ ...form, billingType: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="billable">Billable</option>
                <option value="non-billable">Non-Billable</option>
                <option value="internal">Internal</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              rows={3}
              placeholder="What did you work on?"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
            >Cancel</button>
            <button
              id="ts-submit-btn"
              type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-60"
            >{saving ? "Saving…" : "Log Time"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TimesheetsPage() {
  const { user, loading: userLoading } = useCurrentUser();

  const [timesheets,   setTimesheets]   = useState<Timesheet[]>([]);
  const [projects,     setProjects]     = useState<Project[]>([]);
  const [tasks,        setTasks]        = useState<Task[]>([]);
  const [showModal,    setShowModal]    = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tsRes, projRes, taskRes] = await Promise.allSettled([
        timesheetsApi.getAll(),
        projectsApi.getAll(),
        tasksApi.getAll(),
      ]);
      // Backend already enforces data isolation — no frontend filtering needed
      if (tsRes.status   === "fulfilled") setTimesheets(tsRes.value?.data?.data   || tsRes.value?.data   || []);
      if (projRes.status === "fulfilled") setProjects(projRes.value?.data?.data   || projRes.value?.data || []);
      if (taskRes.status === "fulfilled") setTasks(taskRes.value?.data?.data      || taskRes.value?.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load timesheets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSave(data: Partial<Timesheet>) {
    await timesheetsApi.create(data);
    await fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this timesheet entry?")) return;
    await timesheetsApi.remove(id);
    setTimesheets((prev) => prev.filter((t) => t._id !== id));
  }

  const filtered = statusFilter
    ? timesheets.filter((t) => t.status === statusFilter)
    : timesheets;

  const totalHours    = filtered.reduce((a, t) => a + t.hours, 0);
  const billableHours = filtered.filter((t) => t.billingType === "billable").reduce((a, t) => a + t.hours, 0);
  const pendingCount  = filtered.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-8 pb-8">
      {showModal && (
        <TimeEntryModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          projects={projects}
          tasks={tasks}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Timesheets</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Track your own logged hours — submitted entries await manager approval
          </p>
        </div>
        <button
          id="add-timesheet-btn"
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md transition-all duration-150 flex items-center gap-2"
        >
          ＋ Log Time
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">My Total Hours</p>
          <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{totalHours.toFixed(1)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
            Billable Hours
            <InfoTooltip text="Client chargeable work" />
          </p>
          <p className="text-3xl font-bold mt-1 text-blue-600">{billableHours.toFixed(1)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Awaiting Approval</p>
          <p className="text-3xl font-bold mt-1 text-amber-500">{pendingCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-4 flex-wrap">
          <select
            id="ts-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <span className="text-xs text-gray-400 dark:text-zinc-500 ml-auto">
            Showing my data only — filtered by server
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-800/50">
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Task</th>
                <th className="px-5 py-4 font-semibold">Project</th>
                <th className="px-5 py-4 font-semibold">Hours</th>
                <th className="px-5 py-4 font-semibold">
                  <span className="flex items-center gap-1">
                    Billing Type
                    <InfoTooltip text="Billable = client chargeable · Internal = non-billable" />
                  </span>
                </th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Submitted By</th>
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Loading your timesheets…
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">⏱</span>
                      <p className="text-sm">No timesheet entries yet</p>
                      <p className="text-xs text-gray-400">Click &quot;Log Time&quot; to start tracking</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((ts) => (
                  <tr
                    key={ts._id}
                    className="border-t border-gray-50 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition"
                  >
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {new Date(ts.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800 dark:text-gray-200">
                      {ts.taskId?.title || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                      {ts.projectId?.projectTitle || "—"}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                      {ts.hours}h
                    </td>
                    <td className="px-5 py-4">
                      <BillingBadge type={ts.billingType} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={ts.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                          {ts.userId?.name?.charAt(0) ?? "?"}
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {ts.userId?.name || "You"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {ts.status === "pending" && (
                        <button
                          id={`delete-ts-${ts._id}`}
                          onClick={() => handleDelete(ts._id)}
                          className="text-xs text-gray-400 hover:text-red-500 transition"
                          title="Delete entry"
                        >
                          🗑
                        </button>
                      )}
                      {ts.status !== "pending" && (
                        <span className="text-xs text-gray-300 dark:text-zinc-600 italic">
                          {ts.status === "approved" ? "Locked" : "Rejected"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
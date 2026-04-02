"use client";

/**
 * /dashboard/admin/timesheets
 * ─────────────────────────────────────────────────────────────────────────────
 * Approval page for Admin & Project Manager roles.
 * Fetches all timesheets (backend returns all for elevated roles),
 * allows approve / reject via PATCH /api/timesheets/:id.
 * Protected at render level by RoleGuard.
 */

import { useState, useEffect, useCallback } from "react";
import { timesheetsApi } from "../../../../lib/api";
import RoleGuard from "../../../../components/RoleGuard";
import { useCurrentUser } from "../../../../hooks/useCurrentUser";

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
  reviewedBy?: { name: string };
  reviewedAt?: string;
}

// ── Billing tooltip constants ──────────────────────────────────────────────────
const BILLING_TIPS: Record<string, string> = {
  billable:       "Client chargeable work",
  "non-billable": "Non-billable work",
  internal:       "Non-billable work (internal)",
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:  "bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-400",
    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    rejected: "bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-400",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${map[status] || ""}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function BillingBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    billable:       "bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-400",
    "non-billable": "bg-gray-100   text-gray-600   dark:bg-zinc-800      dark:text-gray-400",
    internal:       "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
  };
  return (
    <span
      title={BILLING_TIPS[type] || type}
      className={`text-xs px-2.5 py-1 rounded-full font-medium cursor-help ${map[type] || ""}`}
    >
      {type.charAt(0).toUpperCase() + type.slice(1).replace("-", "‑")}
    </span>
  );
}

// ── Toast notification ─────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium transition-all
      ${type === "success"
        ? "bg-emerald-600 text-white"
        : "bg-red-600 text-white"}`}
    >
      {type === "success" ? "✓" : "✕"} {message}
    </div>
  );
}

// ── Confirm Modal ──────────────────────────────────────────────────────────────
function ConfirmModal({
  action,
  name,
  onConfirm,
  onCancel,
  busy,
}: {
  action: "approved" | "rejected";
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const isApprove = action === "approved";
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 w-full max-w-sm p-6 space-y-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto
          ${isApprove ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
          {isApprove ? (
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {isApprove ? "Approve" : "Reject"} Timesheet?
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Submitted by <span className="font-semibold text-gray-700 dark:text-gray-200">{name}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition disabled:opacity-60
              ${isApprove
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"}`}
          >
            {busy ? "Processing…" : isApprove ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main inner page (rendered only when role check passes) ────────────────────
function AdminTimesheetsInner() {
  const { user } = useCurrentUser();

  const [timesheets,   setTimesheets]   = useState<Timesheet[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [search,       setSearch]       = useState("");
  const [busy,         setBusy]         = useState<string | null>(null); // id being processed
  const [toast,        setToast]        = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirm,      setConfirm]      = useState<{
    id: string; action: "approved" | "rejected"; name: string;
  } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await timesheetsApi.getAll("&limit=500");
      const data: Timesheet[] = res?.data?.data || res?.data || [];
      setTimesheets(data);
    } catch (err: any) {
      setError(err.message || "Failed to load timesheets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Apply client-side filters (data is already org-scoped from backend)
  const filtered = timesheets.filter((ts) => {
    if (statusFilter && ts.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchUser    = ts.userId?.name?.toLowerCase().includes(q);
      const matchProject = ts.projectId?.projectTitle?.toLowerCase().includes(q);
      const matchTask    = ts.taskId?.title?.toLowerCase().includes(q);
      if (!matchUser && !matchProject && !matchTask) return false;
    }
    return true;
  });

  const pendingCount  = timesheets.filter((t) => t.status === "pending").length;
  const approvedCount = timesheets.filter((t) => t.status === "approved").length;
  const rejectedCount = timesheets.filter((t) => t.status === "rejected").length;
  const totalHours    = timesheets.filter((t) => t.status === "approved")
                                   .reduce((a, t) => a + t.hours, 0);

  function requestAction(id: string, action: "approved" | "rejected", name: string) {
    setConfirm({ id, action, name });
  }

  async function executeAction() {
    if (!confirm) return;
    setBusy(confirm.id);
    try {
      await timesheetsApi.approve(confirm.id, confirm.action);
      setTimesheets((prev) =>
        prev.map((t) => t._id === confirm.id ? { ...t, status: confirm.action } : t)
      );
      setToast({ message: `Timesheet ${confirm.action} successfully`, type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Action failed", type: "error" });
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  }

  return (
    <div className="space-y-8 pb-8">
      {toast    && <Toast {...toast} />}
      {confirm  && (
        <ConfirmModal
          action={confirm.action}
          name={confirm.name}
          busy={busy === confirm.id}
          onConfirm={executeAction}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Timesheet Approval</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Review and approve timesheet entries from all team members
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition flex items-center gap-2 disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M4.582 9A8 8 0 0120 15M19.418 15A8 8 0 014 9" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pending",           value: pendingCount,  color: "text-amber-500"   },
          { label: "Approved",          value: approvedCount, color: "text-emerald-500" },
          { label: "Rejected",          value: rejectedCount, color: "text-red-500"     },
          { label: "Approved Hrs",      value: `${totalHours.toFixed(1)}h`, color: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-4 flex-wrap">
          {/* Status tabs */}
          <div className="flex rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden text-sm">
            {["", "pending", "approved", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 font-medium transition ${
                  statusFilter === s
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                }`}
              >
                {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7 7 0 1116.65 3a7 7 0 010 13.65z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, project or task…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <span className="text-xs text-gray-400 dark:text-zinc-500 ml-auto">
            All org data — {filtered.length} entr{filtered.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-800/50">
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">User</th>
                <th className="px-5 py-4 font-semibold">Task</th>
                <th className="px-5 py-4 font-semibold">Project</th>
                <th className="px-5 py-4 font-semibold">Hours</th>
                <th className="px-5 py-4 font-semibold">Billing Type</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Loading all timesheets…
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">✅</span>
                      <p className="text-sm">No timesheets match this filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((ts) => {
                  const isBusy = busy === ts._id;
                  return (
                    <tr
                      key={ts._id}
                      className={`border-t border-gray-50 dark:border-zinc-800 transition ${
                        isBusy ? "opacity-50" : "hover:bg-gray-50 dark:hover:bg-zinc-800/40"
                      }`}
                    >
                      {/* Date */}
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {new Date(ts.date).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </td>

                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {ts.userId?.name?.charAt(0) ?? "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {ts.userId?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500">
                              {ts.userId?.email || ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Task */}
                      <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                        {ts.taskId?.title || <span className="text-gray-400">—</span>}
                      </td>

                      {/* Project */}
                      <td className="px-5 py-4 font-medium text-gray-800 dark:text-gray-200">
                        {ts.projectId?.projectTitle || "—"}
                      </td>

                      {/* Hours */}
                      <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                        {ts.hours}h
                      </td>

                      {/* Billing Type */}
                      <td className="px-5 py-4">
                        <BillingBadge type={ts.billingType} />
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <StatusBadge status={ts.status} />
                        {ts.reviewedAt && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(ts.reviewedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        {ts.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <button
                              id={`approve-ts-${ts._id}`}
                              onClick={() => requestAction(ts._id, "approved", ts.userId?.name || "User")}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition disabled:opacity-50"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                            <button
                              id={`reject-ts-${ts._id}`}
                              onClick={() => requestAction(ts._id, "rejected", ts.userId?.name || "User")}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition disabled:opacity-50"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-zinc-600 italic">
                            {ts.status === "approved" ? "Approved ✓" : "Rejected ✕"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Page export — wrapped in RoleGuard ────────────────────────────────────────
export default function AdminTimesheetsPage() {
  return (
    <RoleGuard allowed={["admin", "project_manager"]} redirect="/dashboard">
      <AdminTimesheetsInner />
    </RoleGuard>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { reportsApi } from "../../../lib/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProjectReport {
  project: string;
  completion: number;
  tasksCompleted: number;
  tasksRemaining: number;
  status: string;
}

interface ProductivityReport {
  user: string;
  tasksCompleted: number;
  avgCompletionHours: number;
  overdueTasks: number;
}

interface DelayReport {
  task: string;
  expectedDate: string | null;
  actualDate: string | null;
  delayDays: number;
  status: string;
}

// ── Export utils ──────────────────────────────────────────────────────────────
function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(","),
    ...data.map((row) =>
      keys.map((k) => JSON.stringify(row[k] ?? "")).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(sectionId: string, filename: string) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const html = `<html><head><title>${filename}</title><style>body{font-family:sans-serif;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}</style></head><body>${el.innerHTML}</body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    completed: "bg-blue-100 text-blue-700",
    draft: "bg-gray-100 text-gray-600",
    review: "bg-amber-100 text-amber-700",
    archived: "bg-red-100 text-red-600",
    done: "bg-emerald-100 text-emerald-700",
    todo: "bg-gray-100 text-gray-600",
    in_progress: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${m[status] || "bg-gray-100 text-gray-600"} dark:bg-opacity-20`}>
      {status.replace("_", " ")}
    </span>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <svg className="animate-spin h-7 w-7 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <span className="text-4xl mb-3">📊</span>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

interface ReportItem {
  projectName: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
  completion: number;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "productivity" | "delays">("projects");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await reportsApi.getConsolidated();
      setReports(res?.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const tabs = [
    { id: "projects" as const, label: "Project Progress" },
    { id: "productivity" as const, label: "Team Productivity" },
    { id: "delays" as const, label: "Task Delays" },
  ];

  // Derived KPI values from live consolidated data
  const totalProjects = reports.length;
  const avgCompletion = totalProjects
    ? Math.round(reports.reduce((a, r) => a + r.completion, 0) / totalProjects)
    : 0;
  const tasksCompleted = reports.reduce((a, r) => a + r.completed, 0);
  const tasksRemaining = reports.reduce((a, r) => a + (r.total - r.completed), 0);
  const overdueTotal = reports.reduce((a, r) => a + r.overdue, 0);

  // Chart transformations (Real Data)
  const chartData = reports.map(r => ({
    name: r.projectName,
    completion: r.completion
  }));

  const teamData = [
    { name: "Completed", value: reports.reduce((sum, r) => sum + r.completed, 0) },
    { name: "Overdue", value: reports.reduce((sum, r) => sum + r.overdue, 0) },
    { name: "In Progress", value: reports.reduce((sum, r) => sum + r.inProgress, 0) },
  ];

  const delayData = reports.map(r => ({
    project: r.projectName,
    delay: r.overdue
  }));

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports &amp; Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Deep insights into project performance</p>
        </div>
        <div className="flex gap-2">
          <button
            id="export-csv-btn"
            onClick={() => {
              exportCSV(reports as any, `consolidated-report`);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
          >
            📊 Export CSV
          </button>
          <button
            id="export-pdf-btn"
            onClick={() => exportPDF(`report-${activeTab}`, `${activeTab}-report`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition shadow-md"
          >
            📄 Export PDF
          </button>
          <button
            id="reports-refresh-btn"
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* KPI Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Projects", value: loading ? "—" : totalProjects, color: "text-violet-600" },
          { label: "Avg Completion", value: loading ? "—" : `${avgCompletion}%`, color: "text-blue-600" },
          { label: "Tasks Completed", value: loading ? "—" : tasksCompleted, color: "text-emerald-600" },
          { label: "Tasks Remaining", value: loading ? "—" : tasksRemaining, color: "text-amber-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`report-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition -mb-px ${activeTab === tab.id
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PROJECT PROGRESS TAB ── */}
      {activeTab === "projects" && (
        <div id="report-projects" className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Completion by Project</h3>
            {loading ? (
              <Spinner />
            ) : reports.length === 0 ? (
              <EmptyState label="No project data available" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(17,24,39,0.9)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(v) => [`${Number(v)}%`, "Completion"]}
                  />
                  <Bar dataKey="completion" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Completion %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <Spinner />
            ) : reports.length === 0 ? (
              <EmptyState label="No project reports found" />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                    <th className="px-5 py-4 font-semibold">Project</th>
                    <th className="px-5 py-4 font-semibold">Tasks Done / Total</th>
                    <th className="px-5 py-4 font-semibold">Completion %</th>
                    <th className="px-5 py-4 font-semibold text-center">Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, i) => (
                    <tr key={i} className="border-t border-gray-50 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition">
                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">{r.projectName}</td>
                      <td className="px-5 py-4 text-gray-500">{r.completed} / {r.total}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${r.completion}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-8 text-right">{r.completion}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`font-semibold ${r.overdue > 0 ? "text-red-500" : "text-emerald-500"}`}>
                          {r.overdue > 0 ? `+${r.overdue}` : "None"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── PRODUCTIVITY TAB ── */}
      {activeTab === "productivity" && (
        <div id="report-productivity" className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Aggregated Team Productivity</h3>
            {loading ? (
              <Spinner />
            ) : reports.length === 0 ? (
              <EmptyState label="No productivity data available" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={teamData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "rgba(17,24,39,0.9)", border: "none", borderRadius: "8px", color: "#fff" }} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Tasks" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Completed", value: reports.reduce((a, b) => a + b.completed, 0), color: "text-emerald-500" },
              { label: "Total Overdue", value: reports.reduce((a, b) => a + b.overdue, 0), color: "text-red-500" },
              { label: "Total In Progress", value: reports.reduce((a, b) => a + b.inProgress, 0), color: "text-blue-500" },
            ].map(card => (
              <div key={card.label} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                <p className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2">{card.label}</p>
                <p className={`text-4xl font-black ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DELAYS TAB ── */}
      {activeTab === "delays" && (
        <div id="report-delays" className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <Spinner />
          ) : reports.length === 0 ? (
            <EmptyState label="No delay reports found" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-800/50">
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-4 font-semibold">Project</th>
                  <th className="px-5 py-4 font-semibold">Total Tasks</th>
                  <th className="px-5 py-4 font-semibold text-center">Overdue Tasks</th>
                  <th className="px-5 py-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr key={i} className="border-t border-gray-50 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition">
                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">{r.projectName}</td>
                    <td className="px-5 py-4 text-gray-500">{r.total}</td>
                    <td className="px-5 py-4 text-center text-red-500 font-bold">{r.overdue}</td>
                    <td className="px-5 py-4 text-center">
                      {r.overdue > 0 ? (
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-600 rounded-lg">Delayed</span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-600 rounded-lg">On Track</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
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
  Cell
} from "recharts";

// ── Colors ────────────────────────────────────────────────────────────────────
const COLORS = {
  completed: "#22c55e",
  inProgress: "#eab308",
  overdue: "#ef4444",
  secondary: "#8b5cf6",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface ReportItem {
  projectName: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
  completion: number;
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
      console.log("API Data:", res?.data); // Requested debug log
      setReports(res?.data || []);
    } catch (err: any) {
      console.error("Report fetch error:", err);
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
    ? Math.round(reports.reduce((a, r) => a + (r.completion || 0), 0) / totalProjects)
    : 0;
  const tasksCompleted = reports.reduce((a, r) => a + (r.completed || 0), 0);
  const tasksRemaining = reports.reduce((a, r) => a + ((r.total || 0) - (r.completed || 0)), 0);
  const overdueTotal = reports.reduce((a, r) => a + (r.overdue || 0), 0);

  // Chart transformations (Real Data)
  const projectChartData = reports.map(r => ({
    name: r.projectName || "Unnamed",
    completion: r.completion || 0
  }));

  const teamData = [
    { name: "Completed", value: reports.reduce((sum, r) => sum + (r.completed || 0), 0), color: COLORS.completed },
    { name: "In Progress", value: reports.reduce((sum, r) => sum + (r.inProgress || 0), 0), color: COLORS.inProgress },
    { name: "Overdue", value: reports.reduce((sum, r) => sum + (r.overdue || 0), 0), color: COLORS.overdue },
  ];

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
            onClick={() => exportCSV(reports as any, `consolidated-report`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition shadow-sm"
          >
            📊 Export CSV
          </button>
          <button
            id="reports-refresh-btn"
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition shadow-sm"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Projects", value: loading ? "—" : totalProjects, color: "text-violet-600" },
          { label: "Avg Completion", value: loading ? "—" : `${avgCompletion}%`, color: "text-blue-600" },
          { label: "Tasks Completed", value: loading ? "—" : tasksCompleted, color: "text-emerald-600" },
          { label: "Overdue / Total", value: loading ? "—" : `${overdueTotal} / ${tasksCompleted + tasksRemaining}`, color: "text-red-500" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">{kpi.label}</p>
            <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {/* ── PROJECT PROGRESS TAB ── */}
      {activeTab === "projects" && (
        <div id="report-projects" className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm min-h-[350px]">
            <h3 className="font-semibold mb-6 text-gray-900 dark:text-white">Completion by Project (%)</h3>
            {loading ? (
              <Spinner />
            ) : reports.length === 0 ? (
              <EmptyState label="No project data available" />
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectChartData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" strokeOpacity={0.1} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: "#18181b", border: "none", borderRadius: "8px", fontSize: "12px" }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(v) => [`${v}%`, "Completion"]}
                    />
                    <Bar dataKey="completion" fill={COLORS.secondary} radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-800/50 text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-bold">Project Name</th>
                  <th className="px-6 py-4 font-bold">Tasks (Done/Total)</th>
                  <th className="px-6 py-4 font-bold text-center">Progress %</th>
                  <th className="px-6 py-4 font-bold text-center">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {reports.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{r.projectName}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      <span className="font-bold text-gray-700 dark:text-gray-200">{r.completed || 0}</span> / {r.total || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${r.completion}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold w-10 text-right">{r.completion}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${r.overdue > 0 ? "text-red-500" : "text-emerald-500"}`}>
                        {r.overdue > 0 ? `+${r.overdue}` : "0"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && reports.length === 0 && (
                  <tr><td colSpan={4} className="py-20 text-center text-gray-400">No projects found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PRODUCTIVITY TAB ── */}
      {activeTab === "productivity" && (
        <div id="report-productivity" className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm min-h-[350px]">
            <h3 className="font-semibold mb-6 text-gray-900 dark:text-white">Overall Task Distribution</h3>
            {loading ? (
              <Spinner />
            ) : reports.length === 0 ? (
              <EmptyState label="No productivity data available" />
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" strokeOpacity={0.1} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: "#18181b", border: "none", borderRadius: "8px" }} itemStyle={{ color: "#fff" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
                      {teamData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-6">
            {teamData.map(card => (
              <div key={card.name} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                <p className="text-xs uppercase font-bold text-gray-400 tracking-widest mb-4">{card.name}</p>
                <div className="flex items-end justify-between">
                   <p className="text-4xl font-black" style={{ color: card.color }}>{card.value}</p>
                   {card.value > 0 && <span className="text-[10px] font-bold text-gray-500 mb-1">Items</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DELAYS TAB ── */}
      {activeTab === "delays" && (
        <div id="report-delays" className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-800/50 text-left text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-bold">Project</th>
                <th className="px-6 py-4 font-bold text-center">Total Tasks</th>
                <th className="px-6 py-4 font-bold text-center">Delayed Count</th>
                <th className="px-6 py-4 font-bold text-center">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {reports.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{r.projectName}</td>
                  <td className="px-6 py-4 text-center text-gray-500">{r.total}</td>
                  <td className="px-6 py-4 text-center text-red-500 font-bold">{r.overdue}</td>
                  <td className="px-6 py-4 text-center">
                    {r.overdue > 3 ? (
                      <span className="px-3 py-1 text-[10px] font-bold uppercase bg-red-100 text-red-700 rounded-full dark:bg-red-900/30">Action Needed</span>
                    ) : r.overdue > 0 ? (
                      <span className="px-3 py-1 text-[10px] font-bold uppercase bg-amber-100 text-amber-700 rounded-full dark:bg-amber-900/30">Behind Schedule</span>
                    ) : (
                      <span className="px-3 py-1 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 rounded-full dark:bg-emerald-900/30">Healthy</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && reports.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-gray-500">
                    No delay data available for the current projects.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
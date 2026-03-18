"use client";

import { useState, useEffect, useCallback } from "react";
import api from "../../../lib/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
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

// ── Demo Data ─────────────────────────────────────────────────────────────────
const demoProj: ProjectReport[] = [
  { project: "ERP System", completion: 70, tasksCompleted: 28, tasksRemaining: 12, status: "active" },
  { project: "Mobile App", completion: 50, tasksCompleted: 18, tasksRemaining: 18, status: "active" },
  { project: "Website Redesign", completion: 85, tasksCompleted: 34, tasksRemaining: 6, status: "review" },
  { project: "CRM System", completion: 40, tasksCompleted: 14, tasksRemaining: 21, status: "active" },
];
const demoProd: ProductivityReport[] = [
  { user: "John Doe", tasksCompleted: 22, avgCompletionHours: 4, overdueTasks: 1 },
  { user: "Maria Smith", tasksCompleted: 18, avgCompletionHours: 3, overdueTasks: 0 },
  { user: "Alex Lee", tasksCompleted: 12, avgCompletionHours: 6, overdueTasks: 3 },
  { user: "Dana R.", tasksCompleted: 9, avgCompletionHours: 5, overdueTasks: 0 },
];
const demoDelay: DelayReport[] = [
  { task: "API Integration", expectedDate: "2026-03-01", actualDate: "2026-03-05", delayDays: 4, status: "done" },
  { task: "UI Redesign", expectedDate: "2026-03-10", actualDate: null, delayDays: 3, status: "in_progress" },
  { task: "Database Migration", expectedDate: "2026-02-28", actualDate: "2026-02-27", delayDays: 0, status: "done" },
  { task: "Load Testing", expectedDate: "2026-03-12", actualDate: null, delayDays: 1, status: "todo" },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [projects, setProjects] = useState<ProjectReport[]>([]);
  const [productivity, setProductivity] = useState<ProductivityReport[]>([]);
  const [delays, setDelays] = useState<DelayReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"projects" | "productivity" | "delays">("projects");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, prodRes, dRes] = await Promise.allSettled([
        api.get<any>("/reports/projects"),
        api.get<any>("/reports/productivity"),
        api.get<any>("/reports/delays"),
      ]);
      if (pRes.status === "fulfilled") setProjects(pRes.value?.data || []);
      if (prodRes.status === "fulfilled") setProductivity(prodRes.value?.data || []);
      if (dRes.status === "fulfilled") setDelays(dRes.value?.data || []);
    } catch (_) {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const p = projects.length ? projects : demoProj;
  const prod = productivity.length ? productivity : demoProd;
  const d = delays.length ? delays : demoDelay;

  const tabs = [
    { id: "projects" as const, label: "Project Progress" },
    { id: "productivity" as const, label: "Team Productivity" },
    { id: "delays" as const, label: "Task Delays" },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Deep insights into project performance</p>
        </div>
        <div className="flex gap-2">
          <button
            id="export-csv-btn"
            onClick={() => {
              const data = activeTab === "projects" ? p : activeTab === "productivity" ? prod : d;
              exportCSV(data as any, `${activeTab}-report`);
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
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Projects", value: p.length, color: "text-violet-600" },
          { label: "Avg Completion", value: `${Math.round(p.reduce((a, r) => a + r.completion, 0) / (p.length || 1))}%`, color: "text-blue-600" },
          { label: "Tasks Completed", value: p.reduce((a, r) => a + r.tasksCompleted, 0), color: "text-emerald-600" },
          { label: "Tasks Remaining", value: p.reduce((a, r) => a + r.tasksRemaining, 0), color: "text-amber-600" },
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
            className={`px-5 py-3 text-sm font-medium border-b-2 transition -mb-px ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "projects" && (
        <div id="report-projects" className="space-y-6">
          {/* Chart */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Completion by Project</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={p} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="project" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "rgba(17,24,39,0.9)", border: "none", borderRadius: "8px", color: "#fff" }}
                  formatter={(v: number) => [`${v}%`, "Completion"]}
                />
                <Bar dataKey="completion" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Table */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-800/50">
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-4 font-semibold">Project</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Completion %</th>
                  <th className="px-5 py-4 font-semibold text-center">Tasks Done</th>
                  <th className="px-5 py-4 font-semibold text-center">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {p.map((r, i) => (
                  <tr key={i} className="border-t border-gray-50 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition">
                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">{r.project}</td>
                    <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${r.completion}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-8 text-right">{r.completion}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center text-emerald-600 font-semibold">{r.tasksCompleted}</td>
                    <td className="px-5 py-4 text-center text-amber-600 font-semibold">{r.tasksRemaining}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "productivity" && (
        <div id="report-productivity" className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Team Productivity</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={prod} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="user" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "rgba(17,24,39,0.9)", border: "none", borderRadius: "8px", color: "#fff" }} />
                <Legend />
                <Bar dataKey="tasksCompleted" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="overdueTasks" fill="#ef4444" radius={[4, 4, 0, 0]} name="Overdue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-800/50">
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-4 font-semibold">User</th>
                  <th className="px-5 py-4 font-semibold text-center">Tasks Completed</th>
                  <th className="px-5 py-4 font-semibold text-center">Avg. Hours</th>
                  <th className="px-5 py-4 font-semibold text-center">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {prod.map((r, i) => (
                  <tr key={i} className="border-t border-gray-50 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition">
                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">{r.user}</td>
                    <td className="px-5 py-4 text-center text-emerald-600 font-semibold">{r.tasksCompleted}</td>
                    <td className="px-5 py-4 text-center text-blue-600 font-semibold">{r.avgCompletionHours}h</td>
                    <td className="px-5 py-4 text-center"><span className={`font-semibold ${r.overdueTasks > 0 ? "text-red-500" : "text-gray-400"}`}>{r.overdueTasks}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "delays" && (
        <div id="report-delays" className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-800/50">
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                <th className="px-5 py-4 font-semibold">Task</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Expected Date</th>
                <th className="px-5 py-4 font-semibold">Actual Date</th>
                <th className="px-5 py-4 font-semibold text-center">Delay (Days)</th>
              </tr>
            </thead>
            <tbody>
              {d.map((r, i) => (
                <tr key={i} className="border-t border-gray-50 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition">
                  <td className="px-5 py-4 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{r.task}</td>
                  <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-4 text-gray-500 dark:text-gray-400 text-xs">
                    {r.expectedDate ? new Date(r.expectedDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-4 text-gray-500 dark:text-gray-400 text-xs">
                    {r.actualDate ? new Date(r.actualDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`font-bold text-sm ${r.delayDays > 0 ? "text-red-500" : "text-emerald-500"}`}>
                      {r.delayDays > 0 ? `+${r.delayDays}` : "On time"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
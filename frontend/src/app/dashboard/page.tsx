"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { dashboardApi, activityApi } from "../../lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Summary {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  overdueTasks: number;
  teamUtilization: number;
}

interface Health {
  time: string;
  tasks: string;
  workload: string;
  progress: string;
  cost: string;
}

interface TaskAnalytic {
  name: string;
  value: number;
  color: string;
}

interface ProjectProgress {
  name: string;
  progress: number;
}

interface WorkloadItem {
  user: string;
  assigned: number;
  completed: number;
  overdue: number;
}

interface CostItem {
  label: string;
  actual: number;
  planned: number;
  budget: number;
}

interface ActivityItem {
  _id: string;
  action: string;
  entityType: string;
  metadata: Record<string, string>;
  createdAt: string;
  userId?: { name: string; email: string };
}

// ── Helper ────────────────────────────────────────────────────────────────────
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function actionLabel(action: string, meta: Record<string, string>) {
  const map: Record<string, string> = {
    "task:created": `Created task "${meta?.title || ""}"`,
    "task:updated": `Updated task "${meta?.title || ""}"`,
    "task:moved": `Moved task to ${meta?.status || ""}`,
    "task:completed": `Completed a task`,
    "project:created": `Created project "${meta?.title || ""}"`,
    "project:updated": `Updated project`,
    "comment:added": `Added a comment`,
    "file:uploaded": `Uploaded a file`,
    "timesheet:submitted": `Submitted timesheet`,
    "discussion:created": `Started a discussion`,
  };
  return map[action] || action;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({
  label,
  value,
  gradient,
  icon,
  sub,
}: {
  label: string;
  value: string | number;
  gradient: string;
  icon: string;
  sub?: string;
}) {
  return (
    <div
      className={`${gradient} rounded-2xl p-5 text-white shadow-lg hover:scale-[1.02] transition-transform duration-200`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-medium opacity-70 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-4xl font-bold">{value}</div>
      {sub && <div className="text-xs opacity-70 mt-1">{sub}</div>}
    </div>
  );
}

// ── Health Row ────────────────────────────────────────────────────────────────
function HealthRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  const isGood =
    value.includes("ahead") || value.includes("under") || value.includes("0 overdue");
  const isWarn =
    value.includes("behind") || value.includes("over budget");

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      </div>
      <span
        className={`text-sm font-semibold ${isGood
            ? "text-emerald-500"
            : isWarn
              ? "text-red-500"
              : "text-blue-500"
          }`}
      >
        {value}
      </span>
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [taskAnalytics, setTaskAnalytics] = useState<TaskAnalytic[]>([]);
  const [projectProgress, setProjectProgress] = useState<ProjectProgress[]>([]);
  const [workload, setWorkload] = useState<WorkloadItem[]>([]);
  const [costData, setCostData] = useState<CostItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, healthRes, taRes, ppRes, wlRes, costRes, actRes] =
        await Promise.allSettled([
          dashboardApi.summary(),
          dashboardApi.health(),
          dashboardApi.taskAnalytics(),
          dashboardApi.projectProgress(),
          dashboardApi.workload(),
          dashboardApi.costAnalysis(),
          activityApi.recent(8),
        ]);

      if (sumRes.status === "fulfilled")     setSummary((sumRes.value as any).data || null);
      if (healthRes.status === "fulfilled")  setHealth((healthRes.value as any).data || null);
      if (taRes.status === "fulfilled")      setTaskAnalytics((taRes.value as any).data || []);
      if (ppRes.status === "fulfilled")      setProjectProgress((ppRes.value as any).data || []);
      if (wlRes.status === "fulfilled")      setWorkload((wlRes.value as any).data || []);
      if (costRes.status === "fulfilled")    setCostData((costRes.value as any).data || []);
      if (actRes.status === "fulfilled")     setActivity((actRes.value as any).data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="space-y-8 pb-8">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Project Intelligence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Real-time overview of your workspace
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
            🕐 Live
          </span>
          <button
            id="dashboard-refresh-btn"
            onClick={fetchAll}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl transition-all duration-150 shadow-md hover:shadow-blue-200 dark:hover:shadow-blue-900"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard
          label="Total Projects"
          value={loading ? "—" : (summary?.totalProjects ?? "—")}
          gradient="bg-gradient-to-br from-violet-500 to-purple-700"
          icon="📁"
        />
        <KPICard
          label="Active Projects"
          value={loading ? "—" : (summary?.activeProjects ?? "—")}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          icon="🚀"
        />
        <KPICard
          label="Completed Tasks"
          value={loading ? "—" : (summary?.completedTasks ?? "—")}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          icon="✅"
        />
        <KPICard
          label="Overdue Tasks"
          value={loading ? "—" : (summary?.overdueTasks ?? "—")}
          gradient="bg-gradient-to-br from-rose-500 to-red-700"
          icon="⚠️"
        />
        <KPICard
          label="Team Utilization"
          value={loading ? "—" : summary ? `${summary.teamUtilization}%` : "—"}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          icon="👥"
        />
      </div>

      {/* ── ROW 1: Health + Task Analytics ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Project Health */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Project Health Panel
          </h3>
          {loading ? (
            <Spinner />
          ) : !health ? (
            <p className="text-sm text-center text-gray-400 py-8">No health data available</p>
          ) : (
            <>
              <HealthRow label="Time"     value={health.time}     icon="⏱" />
              <HealthRow label="Tasks"    value={health.tasks}    icon="📋" />
              <HealthRow label="Workload" value={health.workload} icon="👤" />
              <HealthRow label="Progress" value={health.progress} icon="📈" />
              <HealthRow label="Cost"     value={health.cost}     icon="💰" />
            </>
          )}
        </div>

        {/* Task Analytics Donut */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            Task Analytics
          </h3>
          {loading ? (
            <Spinner />
          ) : taskAnalytics.length === 0 ? (
            <p className="text-sm text-center text-gray-400 py-8">No task data available</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={taskAnalytics}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {taskAnalytics.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(17,24,39,0.9)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {taskAnalytics.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: item.color }}
                    />
                    {item.name} ({item.value})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── ROW 2: Project Progress + Cost Analysis ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Project Progress Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
            Project Progress
          </h3>
          {loading ? (
            <Spinner />
          ) : projectProgress.length === 0 ? (
            <p className="text-sm text-center text-gray-400 py-8">No project progress data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={projectProgress} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(17,24,39,0.9)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value) => [`${Number(value ?? 0)}%`, "Progress"]}
                />
                <Bar dataKey="progress" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cost Analysis */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Cost Analysis
          </h3>
          {loading ? (
            <Spinner />
          ) : costData.length === 0 ? (
            <p className="text-sm text-center text-gray-400 py-8">No cost data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={costData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(17,24,39,0.9)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value) => [`$${(Number(value ?? 0) / 1000).toFixed(0)}k`]}
                />
                <Legend />
                <Bar dataKey="actual"  fill="#f59e0b" radius={[4, 4, 0, 0]} name="Actual" />
                <Bar dataKey="planned" fill="#6366f1" radius={[4, 4, 0, 0]} name="Planned" />
                <Bar dataKey="budget"  fill="#10b981" radius={[4, 4, 0, 0]} name="Budget" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── ROW 3: Workload + Activity Feed ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Workload Distribution */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            Workload Distribution
          </h3>
          {loading ? (
            <Spinner />
          ) : workload.length === 0 ? (
            <p className="text-sm text-center text-gray-400 py-8">No workload data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-zinc-800">
                    <th className="pb-3 font-semibold">User</th>
                    <th className="pb-3 font-semibold text-center">Assigned</th>
                    <th className="pb-3 font-semibold text-center">Completed</th>
                    <th className="pb-3 font-semibold text-center">Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {workload.map((item, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition"
                    >
                      <td className="py-3 font-medium text-gray-800 dark:text-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                            {item.user.charAt(0).toUpperCase()}
                          </div>
                          {item.user}
                        </div>
                      </td>
                      <td className="py-3 text-center text-blue-600 dark:text-blue-400 font-semibold">
                        {item.assigned}
                      </td>
                      <td className="py-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        {item.completed}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`font-semibold ${item.overdue > 0
                              ? "text-red-500"
                              : "text-gray-400 dark:text-gray-500"
                            }`}
                        >
                          {item.overdue}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 inline-block animate-pulse" />
            Recent Activity
          </h3>

          {loading ? (
            <Spinner />
          ) : activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <span className="text-3xl mb-2">📋</span>
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activity.map((a) => (
                <div key={a._id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {a.userId?.name?.charAt(0) ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{a.userId?.name ?? "Someone"}</span>{" "}
                      {actionLabel(a.action, a.metadata)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {timeAgo(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
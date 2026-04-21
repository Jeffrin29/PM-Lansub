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
import { dashboardApi, request } from "../../lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Summary {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  overdueTasks: number;
  teamUtilization: number;
}

interface ActivityItem {
  _id: string;
  action: string;
  metadata: Record<string, any>;
  createdAt: string;
  userId?: { name: string };
}

// ── Helper ────────────────────────────────────────────────────────────────────
function timeAgo(date: string) {
  if (!date) return "just now";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "just now";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({
  label,
  value,
  gradient,
  icon,
}: {
  label: string;
  value: string | number;
  gradient: string;
  icon: string;
}) {
  return (
    <div className={`${gradient} rounded-xl p-5 text-white shadow-lg shadow-black/10 transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">{label}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

// ── Health Row ────────────────────────────────────────────────────────────────
function HealthRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  const lowValue = value.toLowerCase();
  const isGood = lowValue.includes("ahead") || lowValue.includes("under") || (lowValue.includes("0 overdue") && !lowValue.includes("overdue"));
  const isWarn = lowValue.includes("behind") || lowValue.includes("over budget") || lowValue.includes("overdue");

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 dark:border-zinc-800 last:border-0 px-1">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <span className={`text-sm font-bold ${isGood ? "text-emerald-500" : isWarn ? "text-rose-500" : "text-blue-500"}`}>
        {value}
      </span>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUnified = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request("/dashboard");
      setData(res?.data || res || null);
    } catch (err) {
      console.error("[Dashboard] fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUnified(); }, [fetchUnified]);

  // Handle both nested (summary.totalProjects) and flat (totalProjects) data
  const summary: Summary = data?.summary || {
    totalProjects: data?.totalProjects || 0,
    activeProjects: data?.activeProjects || 0,
    completedTasks: data?.completedTasks || 0,
    overdueTasks: data?.overdueTasks || 0,
    teamUtilization: data?.teamUtilization || 0
  };
  const taskAnalytics = data?.taskAnalytics || [];
  const projectProgress = data?.projectProgress || [];
  const costData = data?.costAnalysis || [];
  const activity: ActivityItem[] = data?.recentActivity || [];

  return (
    <div className="space-y-8 pb-10">

      {/* SECTION 1: Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Intelligence</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Real-time overview of your workspace</p>
        </div>
        <button
          onClick={fetchUnified}
          className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition shadow-md"
        >
          Refresh Data
        </button>
      </div>

      {/* SECTION 2: 5 Gradient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard label="Total Projects" value={loading ? "..." : summary.totalProjects} gradient="bg-gradient-to-br from-blue-500 to-blue-600" icon="📂" />
        <KPICard label="Active Projects" value={loading ? "..." : summary.activeProjects} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" icon="🚀" />
        <KPICard label="Completed Tasks" value={loading ? "..." : summary.completedTasks} gradient="bg-gradient-to-br from-violet-500 to-violet-600" icon="✅" />
        <KPICard label="Overdue Tasks" value={loading ? "..." : summary.overdueTasks} gradient="bg-gradient-to-br from-rose-500 to-rose-600" icon="⚠️" />
        <KPICard label="Team Utilization" value={loading ? "..." : `${summary.teamUtilization}%`} gradient="bg-gradient-to-br from-amber-500 to-amber-600" icon="👥" />
      </div>

      {/* SECTION 3: Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Project Health Panel */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6 uppercase text-xs tracking-widest text-blue-600">Health Panel</h3>
          {loading ? (
            <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-blue-100 border-t-blue-500 rounded-full animate-spin" /></div>
          ) : !data?.health ? (
            <p className="text-sm text-gray-400 text-center py-10">Waiting for diagnostic data...</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-zinc-800">
              <HealthRow label="Timeline" value={data.health.time} icon="🕒" />
              <HealthRow label="Workload" value={data.health.workload} icon="🏋️" />
              <HealthRow label="Budget" value={data.health.cost} icon="💸" />
              <HealthRow label="Risk" value={`${summary.overdueTasks} overdue items`} icon="🛑" />
              <HealthRow label="Progress" value={data.health.progress} icon="📈" />
            </div>
          )}
        </div>

        {/* Right: Task Analytics */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6 uppercase text-xs tracking-widest text-violet-600">Analytics Engine</h3>
          {loading ? (
            <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-blue-100 border-t-blue-500 rounded-full animate-spin" /></div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={taskAnalytics} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    {taskAnalytics.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-4 justify-center mt-4">
                {taskAnalytics?.map((item: any, idx: number) => (
                  <div key={item.name || idx} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase">
                    <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    {item.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Project Progress */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-6 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6 uppercase text-xs tracking-widest text-emerald-600">Mission Progress</h3>
          {loading ? (
            <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-blue-100 border-t-blue-500 rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {projectProgress?.slice(0, 8).map((p: any, idx: number) => (
                <div key={p.name || idx} className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight">
                    <span className="text-gray-600 dark:text-gray-400 truncate">{p.name}</span>
                    <span className="text-blue-600">{p.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-50 dark:bg-zinc-800 rounded-full h-2 overflow-hidden shadow-inner">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-6 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6 uppercase text-xs tracking-widest text-gray-400">Activity Signal</h3>
          {loading ? (
            <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-blue-100 border-t-blue-500 rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activity?.slice(0, 9).map((a: any, idx: number) => (
                <div key={a._id || idx} className="flex gap-3 p-3 bg-gray-50/50 dark:bg-zinc-800/20 rounded-xl border border-transparent hover:border-blue-500/10 transition-all">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                    {a.userId?.name?.charAt(0) ?? "S"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 truncate">{a.action?.replace(":", " ") || "Event"}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{timeAgo(a.createdAt)}</p>
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
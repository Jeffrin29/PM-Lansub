"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { 
  FaFolderOpen, 
  FaRocket, 
  FaCircleCheck, 
  FaTriangleExclamation, 
  FaUsers,
  FaClock,
  FaBriefcase,
  FaWallet,
  FaShieldHalved,
  FaChartLine,
  FaArrowRotateRight
} from "react-icons/fa6";
import { request } from "../../lib/api";

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

// ── Badge Component ───────────────────────────────────────────────────────────
function Badge({ children, variant = "info" }: { children: React.ReactNode; variant?: "success" | "warning" | "danger" | "info" }) {
  const styles = {
    success: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    warning: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    danger: "bg-rose-400/10 text-rose-400 border-rose-400/20",
    info: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${styles[variant]} whitespace-nowrap uppercase tracking-wide`}>
      {children}
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm shadow-black/5 hover:border-blue-500/20 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">{label}</p>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
        </div>
        <div className={`p-4 rounded-xl bg-zinc-800/10 dark:bg-zinc-800/50 ${color} transition-colors group-hover:bg-blue-600/10`}>
          <Icon className="text-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Health Row ────────────────────────────────────────────────────────────────
function HealthRow({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  const lowValue = value.toLowerCase();
  const isGood = lowValue.includes("ahead") || lowValue.includes("under") || (lowValue.includes("0 overdue") && !lowValue.includes("overdue")) || lowValue.includes("healthy") || lowValue.includes("on budget") || lowValue.includes("on schedule");
  const isWarn = lowValue.includes("behind") || lowValue.includes("over budget");
  const isDanger = lowValue.includes("overdue") || lowValue.includes("at risk") || lowValue.includes("risk");

  const variant = isGood ? "success" : isWarn ? "warning" : isDanger ? "danger" : "info";

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 dark:border-zinc-800/40 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 px-2 rounded-lg transition-all">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Icon className="text-sm text-zinc-500" />
        </div>
        <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-100">{label}</span>
      </div>
      <Badge variant={variant}>{value}</Badge>
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

  const summary: Summary = data?.summary || {
    totalProjects: data?.totalProjects || 0,
    activeProjects: data?.activeProjects || 0,
    completedTasks: data?.completedTasks || 0,
    overdueTasks: data?.overdueTasks || 0,
    teamUtilization: data?.teamUtilization || 0
  };
  const taskAnalytics = data?.taskAnalytics || [];
  const projectProgress = data?.projectProgress || [];
  const activity: ActivityItem[] = data?.recentActivity || [];

  return (
    <div className="space-y-8 pb-12">

      {/* SECTION 1: Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Intelligence</h1>
          <p className="text-zinc-500 font-medium text-sm mt-1">Real-time overview of your workspace diagnostic telemetry</p>
        </div>
        <button
          onClick={fetchUnified}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
        >
          <FaArrowRotateRight className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {/* SECTION 2: Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard label="Total Projects" value={loading ? "..." : summary.totalProjects} icon={FaFolderOpen} color="text-cyan-500" />
        <KPICard label="Active Projects" value={loading ? "..." : summary.activeProjects} icon={FaRocket} color="text-emerald-500" />
        <KPICard label="Tasks Completed" value={loading ? "..." : summary.completedTasks} icon={FaCircleCheck} color="text-blue-500" />
        <KPICard label="Overdue Items" value={loading ? "..." : summary.overdueTasks} icon={FaTriangleExclamation} color="text-rose-500" />
        <KPICard label="Utilization" value={loading ? "..." : `${summary.teamUtilization}%`} icon={FaUsers} color="text-amber-500" />
      </div>

      {/* SECTION 3: Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Health Panel (Left) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-zinc-900 dark:text-white uppercase text-[11px] tracking-widest">Health Indicators</h3>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          {loading ? (
            <div className="flex-1 flex justify-center items-center"><div className="w-8 h-8 border-4 border-zinc-100 dark:border-zinc-800 border-t-blue-500 rounded-full animate-spin" /></div>
          ) : !data?.health ? (
            <p className="text-sm text-zinc-500 text-center py-20 italic">No telemetry data...</p>
          ) : (
            <div className="space-y-1">
              <HealthRow label="Timeline" value={data.health.time} icon={FaClock} />
              <HealthRow label="Workload" value={data.health.workload} icon={FaBriefcase} />
              <HealthRow label="Budget" value={data.health.cost} icon={FaWallet} />
              <HealthRow label="Risk" value={summary.overdueTasks > 0 ? "Elevated" : "Normal"} icon={FaShieldHalved} />
              <HealthRow label="Progress" value={data.health.progress} icon={FaChartLine} />
            </div>
          )}
        </div>

        {/* Analytics (Center/Right Spanning) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-zinc-900 dark:text-white uppercase text-[11px] tracking-widest">Task Distribution</h3>
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">By Status</span>
          </div>
          {loading ? (
            <div className="h-64 flex justify-center items-center"><div className="w-8 h-8 border-4 border-zinc-100 dark:border-zinc-800 border-t-blue-500 rounded-full animate-spin" /></div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-12 flex-1">
              <div className="flex-shrink-0 relative w-64 h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={taskAnalytics} cx="50%" cy="50%" innerRadius={75} outerRadius={110} paddingAngle={2} dataKey="value" stroke="none">
                      {taskAnalytics.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: "#18181b", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Total</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{taskAnalytics.reduce((a: number, b: any) => a + b.value, 0)}</div>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                {taskAnalytics?.map((item: any) => (
                  <div key={item.name} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/50">
                    <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                    <div className="flex-1">
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">{item.name}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mission Progress */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-bold text-zinc-900 dark:text-white uppercase text-[11px] tracking-widest flex items-center gap-3">
              Mission Progress
            </h3>
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Active Top 8</span>
          </div>
          {loading ? (
            <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-zinc-100 dark:border-zinc-800 border-t-blue-500 rounded-full animate-spin" /></div>
          ) : !projectProgress || projectProgress.length === 0 ? (
            <div className="py-20 text-center text-zinc-500 text-sm font-medium">
              No active mission telemetry detected
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {projectProgress.slice(0, 8).map((p: any, idx: number) => {
                const name = p.projectName || p.name || p.projectTitle || p.title || `Mission ${idx + 1}`;
                const uniqueKey = p.id || p._id || `${name}-${idx}`;
                
                return (
                  <div 
                    key={uniqueKey} 
                    className="group flex flex-col space-y-4"
                  >
                    <div className="flex justify-between items-end">
                      <span className="text-[13px] font-bold text-gray-900 dark:text-white truncate max-w-[70%] group-hover:text-blue-500 transition-colors">
                        {name}
                      </span>
                      <span className="text-[11px] font-bold text-blue-500">
                        {p.completion || p.progress || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${p.completion || p.progress || 0}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-zinc-900 dark:text-white uppercase text-[11px] tracking-widest flex items-center gap-3">
              System Activity
            </h3>
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Recent Events</span>
          </div>
          {loading ? (
            <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-zinc-100 dark:border-zinc-800 border-t-blue-500 rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activity?.slice(0, 9).map((a: any, idx: number) => (
                <div key={a._id || idx} className="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/20 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white text-xs font-bold flex-shrink-0">
                    {a.userId?.name?.charAt(0) ?? "S"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 truncate mb-0.5">{a.action?.replace(":", " ") || "Terminal Event"}</p>
                    <p className="text-[10px] text-zinc-500 font-medium">{timeAgo(a.createdAt)}</p>
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
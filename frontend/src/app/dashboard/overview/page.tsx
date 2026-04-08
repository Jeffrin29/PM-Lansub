"use client";

import { useState, useEffect, useCallback } from "react";
import api from "../../../lib/api";

// ── Types ────────────────────────────────────────────────────────────────────
interface UrgentTask {
  _id: string;
  title: string;
  dueDate?: string;
  priority: string;
}

interface Project {
  _id: string;
  projectTitle: string;
  completionPercentage: number;
  teamMembers: { userId?: { name?: string } }[];
}

interface LatestComment {
  discussionId: string;
  topic: string;
  project: string | null;
  comment: { author?: { name?: string }; content: string; createdAt: string };
}

interface TeamMember {
  _id: string;
  name: string;
  role: string;
  email: string;
}

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 10 }: { name: string; size?: number }) {
  const colors = [
    "from-blue-400 to-blue-600",
    "from-violet-400 to-purple-600",
    "from-rose-400 to-pink-600",
    "from-amber-400 to-orange-600",
    "from-emerald-400 to-teal-600",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Priority Badge ────────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    urgent: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
    low: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[priority] || styles.low}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

function dueDateLabel(date?: string) {
  if (!date) return null;
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { text: "Overdue", cls: "text-red-500" };
  if (diff === 0) return { text: "Today", cls: "text-red-500" };
  if (diff === 1) return { text: "Tomorrow", cls: "text-amber-500" };
  return {
    text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    cls: "text-gray-500",
  };
}

// ── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCalendar() {
  const [current, setCurrent] = useState(new Date());
  const month = current.getMonth();
  const year = current.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          id="cal-prev-btn"
          onClick={() => setCurrent(new Date(year, month - 1, 1))}
          className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-500 transition"
        >
          ‹
        </button>
        <span className="font-semibold text-sm">
          {monthNames[month]} {year}
        </span>
        <button
          id="cal-next-btn"
          onClick={() => setCurrent(new Date(year, month + 1, 1))}
          className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-500 transition"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          return (
            <div
              key={day}
              className={`p-1.5 rounded-lg cursor-pointer transition text-xs ${
                isToday
                  ? "bg-blue-600 text-white font-bold shadow"
                  : "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tags] = useState(["Design", "Backend", "Frontend", "Testing", "DevOps", "Marketing", "Finance", "Research"]);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/dashboard/overview");
      setData(res.data);
    } catch (err) {
      console.error("Dashboard overview fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const filteredProjects = (data?.projectProgress || []).filter((p: any) =>
    p.projectTitle?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            👋 Workspace Overview
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Your team&apos;s workspace at a glance
          </p>
        </div>
        {/* Search */}
        <div className="relative">
          <input
            id="overview-search"
            type="text"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
        </div>
      </div>

      {/* Top Row: Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: "Active Projects", value: data?.stats?.activeProjects || 0, icon: "📊", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Pending Tasks", value: data?.stats?.pendingTasks || 0, icon: "🔥", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Team Size", value: data?.stats?.teamSize || 0, icon: "👥", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20" },
          { label: "Daily Hours", value: "8h", icon: "⏱️", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center text-lg`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Row 1: Calendar + Urgent Tasks + Team */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            📅 Calendar
          </h3>
          <MiniCalendar />
        </div>

        {/* Urgent Tasks */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            🔥 Urgent Tasks
          </h3>
          <div className="space-y-3">
            {!data?.urgentTasks?.length ? (
              <div className="text-center py-6 text-gray-400">
                <span className="text-3xl block mb-2">🎉</span>
                <p className="text-sm">No urgent tasks right now</p>
              </div>
            ) : data.urgentTasks.map((task: any) => {
              const due = dueDateLabel(task.dueDate);
              return (
                <div
                  key={task._id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {task.title}
                    </p>
                    {due && (
                      <p className={`text-xs mt-0.5 ${due.cls}`}>{due.text}</p>
                    )}
                  </div>
                  <PriorityBadge priority={task.priority} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Directory */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            👥 Team Directory
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {!data?.users?.length ? (
              <div className="col-span-2 text-center py-6 text-gray-400">
                <span className="text-3xl block mb-2">👥</span>
                <p className="text-sm">No team members found</p>
              </div>
            ) : data.users.slice(0, 6).map((member: any) => (
              <div key={member._id} className="flex flex-col items-center text-center p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition">
                <Avatar name={member.name} size={10} />
                <p className="text-sm font-medium mt-2 text-gray-800 dark:text-gray-200">
                  {member.name}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Project Directory + Latest Comments */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            📁 Project Directory
          </h3>
          <div className="space-y-4">
            {filteredProjects.map((proj: any) => (
              <div key={proj._id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {proj.projectTitle}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {proj.completionPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
                    style={{ width: `${proj.completionPercentage}%` }}
                  />
                </div>
              </div>
            ))}
            {filteredProjects.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                No projects found.
              </p>
            )}
          </div>
        </div>

        {/* Latest Comments + Tags */}
        <div className="space-y-6">
          {/* Latest Comments */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              💬 Latest Comments
            </h3>
            {data?.comments?.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <span className="text-3xl block mb-2">💬</span>
                <p className="text-sm">No recent comments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.comments.map((c: any, i: number) => (
                  <div key={i} className="flex gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                    <Avatar name={c.user || "?"} size={8} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5 uppercase font-black tracking-tighter">
                        {c.user} · Latest Activity
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {c.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tag Categories */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              🏷️ Tag Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-800 cursor-pointer hover:shadow-sm transition"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import api, { calendarApi } from "../../../lib/api";

// ── Types ────────────────────────────────────────────────────────────────────
interface CalendarDayData {
  date: string;
  tasks: any[];
  attendance: any[];
  leaves: any[];
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
    high:   "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
    low:    "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400",
  };
  const p = (priority || "low").toLowerCase();
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[p] ?? styles.low}`}>
      {p.charAt(0).toUpperCase() + p.slice(1)}
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

// ── Mini Calendar with day-click ─────────────────────────────────────────────
function MiniCalendar({
  onDateClick,
  selectedDate,
}: {
  onDateClick: (dateStr: string) => void;
  selectedDate: string | null;
}) {
  const [current, setCurrent] = useState(new Date());
  const month = current.getMonth();
  const year  = current.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay   = new Date(year, month, 1).getDay();
  const today = new Date();
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const toDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          id="cal-prev-btn"
          onClick={() => setCurrent(new Date(year, month - 1, 1))}
          className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-500 transition"
        >‹</button>
        <span className="font-semibold text-sm">{monthNames[month]} {year}</span>
        <button
          id="cal-next-btn"
          onClick={() => setCurrent(new Date(year, month + 1, 1))}
          className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-500 transition"
        >›</button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} className="font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = toDateStr(day);
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          const isSelected = selectedDate === dateStr;
          return (
            <div
              key={day}
              onClick={() => onDateClick(dateStr)}
              className={`p-1.5 rounded-lg cursor-pointer transition text-xs ${
                isSelected
                  ? "bg-blue-600 text-white font-bold shadow ring-2 ring-blue-400"
                  : isToday
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold"
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

// ── Calendar Day Panel ────────────────────────────────────────────────────────
function CalendarDayPanel({
  selectedDate,
  dayData,
  loadingDay,
}: {
  selectedDate: string | null;
  dayData: CalendarDayData | null;
  loadingDay: boolean;
}) {
  if (!selectedDate) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 text-center text-gray-400 text-xs py-2">
        Click a date to view tasks, attendance &amp; leaves
      </div>
    );
  }

  const fmt = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-3">
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        📅 {fmt}
      </p>

      {loadingDay ? (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : !dayData ? (
        <p className="text-xs text-gray-400 text-center py-2">No data</p>
      ) : (
        <>
          {/* Tasks */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-500 mb-1">
              📋 Tasks ({dayData.tasks.length})
            </p>
            {dayData.tasks.length === 0 ? (
              <p className="text-xs text-gray-400">No tasks due</p>
            ) : (
              <div className="space-y-1">
                {dayData.tasks.slice(0, 4).map((t: any) => (
                  <div key={t._id} className="flex items-center justify-between text-xs bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2 py-1">
                    <span className="truncate text-gray-700 dark:text-gray-300 max-w-[120px]">{t.title}</span>
                    <PriorityBadge priority={t.priority} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attendance */}
          {dayData.attendance.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500 mb-1">
                ✅ Attendance ({dayData.attendance.length})
              </p>
              {dayData.attendance.slice(0, 3).map((a: any, i: number) => (
                <div key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  {a.user?.name ?? "—"} · {a.status ?? "present"}
                </div>
              ))}
            </div>
          )}

          {/* Leaves */}
          {dayData.leaves.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-500 mb-1">
                🌴 Leaves ({dayData.leaves.length})
              </p>
              {dayData.leaves.slice(0, 3).map((l: any, i: number) => (
                <div key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  {l.user?.name ?? "—"} · {l.leaveType ?? l.type ?? "leave"}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const [data, setData]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [selectedDate, setSelectedDate]   = useState<string | null>(null);
  const [dayData, setDayData]             = useState<CalendarDayData | null>(null);
  const [loadingDay, setLoadingDay]       = useState(false);
  const tags = ["Design","Backend","Frontend","Testing","DevOps","Marketing","Finance","Research"];

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/dashboard/overview");
      console.log("[Overview] API response:", res?.data);
      setData(res.data ?? res);
    } catch (err) {
      console.error("[Overview] fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  // ── Calendar date click ───────────────────────────────────────────────────
  const handleDateClick = useCallback(async (dateStr: string) => {
    console.log("[Calendar] Date clicked:", dateStr);
    setSelectedDate(dateStr);
    setDayData(null);
    setLoadingDay(true);
    try {
      const res: any = await calendarApi.getDayData(dateStr);
      console.log("[Calendar] Day data:", res?.data ?? res);
      setDayData(res?.data ?? res ?? null);
    } catch (err) {
      console.error("[Calendar] getDayData failed:", err);
      setDayData({ date: dateStr, tasks: [], attendance: [], leaves: [] });
    } finally {
      setLoadingDay(false);
    }
  }, []);

  // Normalise project list (handles both 'name' and 'projectTitle' from API)
  const projectList: any[] = data?.projectProgress ?? [];
  const filteredProjects = projectList.filter((p: any) => {
    const title = (p.name || p.projectTitle || "").toLowerCase();
    return title.includes(search.toLowerCase());
  });

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
        <div className="flex items-center gap-3">
          <button
            id="overview-refresh-btn"
            onClick={fetchOverview}
            className="text-xs px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-semibold shadow-md"
          >
            Refresh
          </button>
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
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: "Active Projects", value: data?.stats?.activeProjects ?? 0, icon: "📊", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Pending Tasks",   value: data?.stats?.pendingTasks   ?? 0, icon: "🔥", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Team Size",       value: data?.stats?.teamSize       ?? 0, icon: "👥", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20" },
          { label: "Daily Hours",     value: `${data?.stats?.dailyHours ?? 8}h`, icon: "⏱️", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center text-lg`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Row 1: Calendar + Urgent Tasks + Team */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Calendar with day-click */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            📅 Calendar
          </h3>
          <MiniCalendar onDateClick={handleDateClick} selectedDate={selectedDate} />
          <CalendarDayPanel
            selectedDate={selectedDate}
            dayData={dayData}
            loadingDay={loadingDay}
          />
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
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                    {due && <p className={`text-xs mt-0.5 ${due.cls}`}>{due.text}</p>}
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
              <div
                key={member._id}
                className="flex flex-col items-center text-center p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
              >
                <Avatar name={member.name || "?"} size={10} />
                <p className="text-sm font-medium mt-2 text-gray-800 dark:text-gray-200">{member.name}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest">
                  {member.role?.name || member.role || "—"}
                </p>
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
            {filteredProjects.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                No projects found.
              </p>
            ) : filteredProjects.map((proj: any) => {
              const title = proj.name || proj.projectTitle || "Untitled";
              const pct   = proj.completionPercentage ?? 0;
              return (
                <div key={proj._id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{title}</span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {/* Latest Comments */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              💬 Latest Comments
            </h3>
            {!data?.comments?.length ? (
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
                        {c.user}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{c.text}</p>
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
"use client";

import { useState, useEffect, useCallback } from "react";
import api, { calendarApi, overviewApi } from "../../../lib/api";

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
    "bg-blue-500",
    "bg-violet-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-emerald-500",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div
      className={`w-${size} h-${size} rounded-full ${colors[idx]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Priority Badge ────────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    urgent: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800",
    high:   "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
    low:    "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400 border border-gray-200 dark:border-zinc-700",
  };
  const p = (priority || "low").toLowerCase();
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${styles[p] ?? styles.low}`}>
      {p}
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

// ── Mini Calendar ─────────────────────────────────────────────────────────────
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
    <div className="bg-gray-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-inner">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrent(new Date(year, month - 1, 1))}
          className="p-1 hover:bg-white dark:hover:bg-zinc-800 rounded transition text-gray-400"
        >‹</button>
        <span className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
           {monthNames[month]} {year}
        </span>
        <button
          onClick={() => setCurrent(new Date(year, month + 1, 1))}
          className="p-1 hover:bg-white dark:hover:bg-zinc-800 rounded transition text-gray-400"
        >›</button>
      </div>
      <div className="grid grid-cols-7 text-center text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
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
              className={`p-1.5 rounded-lg cursor-pointer transition text-[10px] font-semibold ${
                isSelected
                  ? "bg-blue-600 text-white shadow-md"
                  : isToday
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20"
                  : "hover:bg-white dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400"
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
      <div className="mt-4 p-4 rounded-xl border border-dashed border-gray-100 dark:border-zinc-800 text-center">
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Select date</p>
      </div>
    );
  }

  const fmt = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Activity / {fmt}</p>
         {loadingDay && <div className="w-3 h-3 border border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />}
      </div>

      {!loadingDay && dayData && (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
               Tasks ({dayData.tasks.length})
            </p>
            {dayData.tasks.length === 0 ? (
               <p className="text-[10px] text-gray-400 pl-3">No deadlines</p>
            ) : (
              <div className="space-y-1.5 pl-3 border-l-2 border-blue-100 dark:border-blue-900">
                {dayData.tasks?.map((t: any, idx: number) => (
                  <div key={t._id || idx} className="flex justify-between items-center gap-1">
                    <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate">{t.title}</span>
                    <PriorityBadge priority={t.priority} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
             <div className="p-2 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30">
                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Attnd</p>
                <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">{dayData.attendance.length}</p>
             </div>
             <div className="p-2 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100/50 dark:border-amber-900/30">
                <p className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">Absnt</p>
                <p className="text-sm font-black text-amber-700 dark:text-amber-400">{dayData.leaves.length}</p>
             </div>
          </div>
        </div>
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

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await overviewApi.get();
      setData(res.data ?? res);
    } catch (err) {
      console.error("[Overview] fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  const handleDateClick = useCallback(async (dateStr: string) => {
    setSelectedDate(dateStr);
    setLoadingDay(true);
    try {
      const res: any = await calendarApi.getDayData(dateStr);
      setDayData(res?.data ?? res ?? null);
    } catch (err) {
      setDayData(null);
    } finally {
      setLoadingDay(false);
    }
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500/20 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workspace Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Real-time organizational summary</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOverview}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-blue-500/20 active:scale-95"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* 4 Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Projects", value: data?.stats?.activeProjects ?? 0, icon: "📊", cls: "text-blue-600" },
          { label: "Pending Tasks",   value: data?.stats?.pendingTasks   ?? 0, icon: "🎯", cls: "text-amber-600" },
          { label: "Team Strength",   value: data?.stats?.teamSize       ?? 0, icon: "👥", cls: "text-violet-600" },
          { label: "Daily Hours",    value: `${data?.stats?.dailyHours ?? 0}h`, icon: "⏱️", cls: "text-emerald-600" },
        ].map((stat, i) => (
          <div key={stat.label || i} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-transform hover:-translate-y-0.5">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.cls}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 3 Column Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Calendar */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 dark:text-white">System Calendar</h3>
              <span className="text-[9px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full uppercase tracking-tighter">Live Monitor</span>
           </div>
           <MiniCalendar onDateClick={handleDateClick} selectedDate={selectedDate} />
           <CalendarDayPanel selectedDate={selectedDate} dayData={dayData} loadingDay={loadingDay} />
        </div>

        {/* Column 2: Urgent Tasks */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 dark:text-white">Urgent Deployment</h3>
              <span className="text-[9px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full uppercase tracking-tighter">High Alpha</span>
           </div>
           <div className="space-y-3 flex-1 overflow-y-auto max-h-[460px] pr-1 scrollbar-hide">
              {!data?.urgentTasks?.length ? (
                <div className="text-center py-12 opacity-30 italic grayscale text-xs font-bold uppercase tracking-widest">No Critical Risks</div>
              ) : data.urgentTasks?.map((task: any, idx: number) => {
                const due = dueDateLabel(task.dueDate);
                return (
                  <div key={task._id || idx} className="p-4 bg-gray-50 dark:bg-zinc-800/40 rounded-xl border border-transparent hover:border-red-500/20 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                       <p className="text-[13px] font-bold text-gray-800 dark:text-white group-hover:text-red-500 transition-colors uppercase tracking-tight leading-tight">{task.title}</p>
                       <PriorityBadge priority={task.priority} />
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[9px] text-gray-400 font-bold uppercase">{task.project || "General Ops"}</span>
                       {due && <span className={`text-[9px] font-black uppercase tracking-tighter ${due.cls}`}>{due.text}</span>}
                    </div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Column 3: Team Directory */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-gray-900 dark:text-white">Operational Units</h3>
              <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full uppercase tracking-tighter">Online</span>
           </div>
           <div className="grid grid-cols-2 gap-3 flex-1">
             {!data?.teamMembers?.length ? (
               <p className="col-span-2 text-center text-xs text-gray-400 font-bold uppercase py-6 italic opacity-40">No units deployed</p>
             ) : data.teamMembers?.slice(0, 10).map((member: any, idx: number) => (
               <div key={member._id || idx} className="p-4 bg-gray-50/50 dark:bg-zinc-800/20 rounded-2xl flex flex-col items-center hover:bg-white dark:hover:bg-zinc-950 transition-all border border-transparent hover:border-indigo-500/10 cursor-pointer shadow-sm">
                 <Avatar name={member.name || "?"} size={9} />
                 <p className="text-[11px] font-bold mt-2.5 text-gray-900 dark:text-white text-center uppercase tracking-tight truncate w-full">{member.name}</p>
                 <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">{member.role?.name || member.role || "Specialist"}</p>
               </div>
             ))}
           </div>
           <button className="w-full mt-6 py-2 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 text-[10px] font-bold uppercase text-gray-500 rounded-xl transition-all">Audit Directory</button>
        </div>

      </div>
    </div>
  );
}
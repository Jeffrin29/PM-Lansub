"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Task {
  id: string;
  title: string;
  status: string;
  user: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  progress?: number;
  project?: string;
}

interface Props {
  tasks: Task[];
  onTaskClick?: (t: Task) => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_BAR: Record<string, string> = {
  "backlog":    "bg-zinc-400 dark:bg-zinc-500",
  "todo":       "bg-blue-500",
  "to do":      "bg-blue-500",
  "in_progress": "bg-orange-500",
  "in progress":"bg-orange-500",
  "complete":   "bg-emerald-500",
  "done":       "bg-emerald-500",
};

const STATUS_LABEL: Record<string, string> = {
  "backlog":     "Backlog",
  "todo":        "To Do",
  "in_progress": "In Progress",
  "complete":    "Complete",
};

function barColor(status: string): string {
  return STATUS_BAR[status?.toLowerCase()] ?? "bg-blue-400";
}

function getMonthName(date: Date): string {
  return date.toLocaleString("default", { month: "short", year: "numeric" });
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((end - start) / 86_400_000);
}

// ─── Avatar circle ────────────────────────────────────────────────────────────
const PALETTE = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-indigo-500"];
function MiniAvatar({ name, idx }: { name: string; idx: number }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-[9px] font-bold text-white ${PALETTE[idx % PALETTE.length]}`}>
      {initials}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const DAY_WIDTH = 40; // width in px

export default function TasksGanttView({ tasks, onTaskClick }: Props) {
  // Timeline anchor — start date of the visible window
  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Show 7 days before today
    return d;
  });

  const DAYS_VISIBLE = 45; // 45 days window

  // Build day columns
  const days = useMemo(() => {
    return Array.from({ length: DAYS_VISIBLE }, (_, i) => addDays(anchor, i));
  }, [anchor]);

  const windowStart = days[0];
  const windowEnd = days[days.length - 1];

  // Tasks enriched with fallback dates
  const enriched = useMemo(() => {
    return tasks.map((t, i) => {
      const start = t.startDate ? new Date(t.startDate) : new Date();
      const end = t.endDate ? new Date(t.endDate) : addDays(start, 2);
      return { ...t, _start: start, _end: end };
    });
  }, [tasks]);

  function barGeometry(start: Date, end: Date): { left: number; width: number } | null {
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    if (e < windowStart || s > windowEnd) return null;

    const offsetDays = daysBetween(windowStart, s < windowStart ? windowStart : s);
    const spanDays = daysBetween(s < windowStart ? windowStart : s, e > windowEnd ? windowEnd : e) + 1;

    return { 
      left: offsetDays * DAY_WIDTH, 
      width: Math.max(spanDays * DAY_WIDTH, 20) 
    };
  }

  const currentMonth = getMonthName(days[0]);
  const endMonth = getMonthName(days[days.length - 1]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <FiCalendar size={40} className="mb-3 opacity-30" />
        <p className="text-sm">No tasks to display on the timeline.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Timeline View</h3>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">
            {currentMonth} {currentMonth !== endMonth ? `- ${endMonth}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAnchor(a => addDays(a, -7))}
            className="h-8 px-2 flex items-center justify-center rounded-lg text-gray-500
              hover:bg-gray-100 dark:hover:bg-zinc-800 transition border border-gray-100 dark:border-zinc-800"
          >
            <FiChevronLeft size={16} />
            <span className="text-[10px] font-bold pr-1">Week</span>
          </button>
          <button
            onClick={() => setAnchor(addDays(new Date(), -7))}
            className="px-3 h-8 rounded-lg text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20
              hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
          >
            Reset
          </button>
          <button
            onClick={() => setAnchor(a => addDays(a, 7))}
            className="h-8 px-2 flex items-center justify-center rounded-lg text-gray-500
              hover:bg-gray-100 dark:hover:bg-zinc-800 transition border border-gray-100 dark:border-zinc-800"
          >
            <span className="text-[10px] font-bold pl-1">Week</span>
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40">
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <span key={key} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
            <span className={`w-2 h-2 rounded-full ${STATUS_BAR[key]}`} />
            {label}
          </span>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        <div style={{ width: 220 + (DAYS_VISIBLE * DAY_WIDTH) }} className="relative">
          
          {/* Header */}
          <div className="sticky top-0 z-30 flex items-stretch border-b border-gray-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm">
            <div className="w-52 shrink-0 px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100 dark:border-zinc-800">
              Task Details
            </div>
            <div className="flex flex-1">
              {days.map((d, i) => {
                const isToday = daysBetween(d, new Date()) === 0;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={i}
                    style={{ width: DAY_WIDTH }}
                    className={`shrink-0 flex flex-col items-center justify-center py-2 border-r border-gray-50 dark:border-zinc-800/50
                      ${isWeekend ? 'bg-gray-50/50 dark:bg-zinc-800/20' : ''}`}
                  >
                    <span className="text-[9px] font-black text-gray-400 uppercase">{d.toLocaleDateString('default', { weekday: 'narrow' })}</span>
                    <span className={`text-[11px] font-black mt-0.5 ${isToday ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center' : 'text-gray-600 dark:text-gray-400'}`}>
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rows */}
          <div className="relative">
            {enriched.map((task, rowIdx) => {
              const geo = barGeometry(task._start, task._end);
              return (
                <div
                  key={task.id}
                  className="flex items-stretch border-b border-gray-50 dark:border-zinc-800/30 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group"
                >
                  {/* Task label */}
                  <div 
                    onClick={() => onTaskClick?.(task)}
                    className="w-52 shrink-0 flex items-center gap-2.5 px-4 py-3 border-r border-gray-100 dark:border-zinc-800 cursor-pointer"
                  >
                    <MiniAvatar name={task.user} idx={rowIdx} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-800 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {task.title}
                      </p>
                      <p className="text-[9px] font-medium text-gray-400 truncate">{task.project}</p>
                    </div>
                  </div>

                  {/* Timeline area */}
                  <div className="flex-1 relative h-14">
                    {/* Columns grid lines */}
                    <div className="absolute inset-0 flex">
                      {days.map((_, i) => (
                        <div key={i} style={{ width: DAY_WIDTH }} className="shrink-0 border-r border-gray-50 dark:border-zinc-800/30" />
                      ))}
                    </div>

                    {/* Today marker column */}
                    {(() => {
                      const todayIdx = days.findIndex(d => daysBetween(d, new Date()) === 0);
                      if (todayIdx === -1) return null;
                      return (
                        <div 
                          style={{ left: todayIdx * DAY_WIDTH, width: DAY_WIDTH }} 
                          className="absolute inset-0 bg-blue-500/5 dark:bg-blue-400/5 z-0 pointer-events-none" 
                        />
                      );
                    })()}

                    {/* Task bar */}
                    {geo && (
                      <div
                        onClick={() => onTaskClick?.(task)}
                        style={{ left: geo.left, width: geo.width }}
                        className="absolute top-1/2 -translate-y-1/2 h-8 rounded-xl
                          flex flex-col shadow-sm cursor-pointer hover:scale-[1.01] transition-all z-20 overflow-hidden"
                      >
                        {/* Background with progress */}
                        <div className={`absolute inset-0 ${barColor(task.status)} opacity-20`} />
                        <div 
                          className={`absolute inset-y-0 left-0 ${barColor(task.status)}`}
                          style={{ width: `${task.progress ?? 0}%` }}
                        />
                        
                        {/* Content */}
                        <div className="relative h-full flex flex-col justify-center px-2">
                           <div className="flex items-center justify-between">
                             <span className="text-[9px] font-black text-black dark:text-white truncate drop-shadow-sm">
                               {task.progress ?? 0}%
                             </span>
                             {task.priority && (
                               <span className="text-[8px] font-black uppercase text-black dark:text-white opacity-40">
                                 {task.priority[0]}
                               </span>
                             )}
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

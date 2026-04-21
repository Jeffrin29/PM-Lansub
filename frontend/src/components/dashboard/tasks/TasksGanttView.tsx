"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";

// --- Types ---
export interface Task {
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
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_BAR: Record<string, string> = {
  "backlog": "bg-zinc-400 dark:bg-zinc-500",
  "todo": "bg-blue-500",
  "in_progress": "bg-orange-500",
  "complete": "bg-emerald-500",
};

const STATUS_LABEL: Record<string, string> = {
  "backlog": "Backlog",
  "todo": "To Do",
  "in_progress": "In Progress",
  "complete": "Complete",
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = Array.from({ length: 11 }, (_, i) => 2020 + i);

function barColor(status: string): string {
  return STATUS_BAR[status?.toLowerCase()] ?? "bg-blue-400";
}

// ─── Avatar circle ────────────────────────────────────────────────────────────
const PALETTE = ["bg-blue-600", "bg-purple-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600", "bg-indigo-600"];
function MiniAvatar({ name, idx }: { name: string; idx: number }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className={`inline-flex w-7 h-7 rounded-lg items-center justify-center text-[10px] font-black text-white shadow-sm ${PALETTE[idx % PALETTE.length]}`}>
      {initials}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const DAY_WIDTH = 44;

export default function TasksGanttView({
  tasks,
  onTaskClick,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange
}: Props) {

  // Logic to determine days in month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedMonth, selectedYear]);

  const monthStart = useMemo(() => new Date(selectedYear, selectedMonth, 1), [selectedMonth, selectedYear]);
  const monthEnd = useMemo(() => new Date(selectedYear, selectedMonth, daysInMonth, 23, 59, 59), [selectedMonth, selectedYear, daysInMonth]);

  // Days array for the month
  const days = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => new Date(selectedYear, selectedMonth, i + 1));
  }, [selectedYear, selectedMonth, daysInMonth]);

  // Filter tasks active in this month
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const s = t.startDate ? new Date(t.startDate) : null;
      const e = t.endDate ? new Date(t.endDate) : (s ? new Date(s.getTime() + 172800000) : null);
      if (!s || !e) return false;

      // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
      return s <= monthEnd && e >= monthStart;
    }).map(t => {
      const s = new Date(t.startDate!);
      const e = t.endDate ? new Date(t.endDate) : new Date(s.getTime() + 172800000);
      return { ...t, _start: s, _end: e };
    });
  }, [tasks, monthStart, monthEnd]);

  function barGeometry(start: Date, end: Date): { left: number; width: number } | null {
    // Relative to month start
    const viewStart = monthStart.getTime();
    const viewEnd = monthEnd.getTime();

    const actualStart = Math.max(start.getTime(), viewStart);
    const actualEnd = Math.min(end.getTime(), viewEnd);

    if (actualStart > actualEnd) return null;

    const leftInMs = actualStart - viewStart;
    const durInMs = (actualEnd - actualStart) + 86400000; // inclusive

    const left = (leftInMs / 86400000) * DAY_WIDTH;
    const width = (durInMs / 86400000) * DAY_WIDTH;

    return { left, width };
  }

  return (
    <div className="flex flex-col h-[750px] w-full max-w-full bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl" style={{ overflow: 'hidden', minWidth: 0 }}>
      {/* ── Fixed Header ── */}
      <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between px-10 py-6 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-50">
        <div className="mb-4 md:mb-0">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Timeline Unit</h3>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-[0.3em] mt-1">Operational Deployment Calendar / {MONTHS[selectedMonth]}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Controls Box */}
          <div className="flex items-center bg-gray-50 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-inner">
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(parseInt(e.target.value))}
              className="bg-transparent text-sm font-black text-gray-700 dark:text-gray-300 px-4 py-2 outline-none cursor-pointer hover:text-blue-600 transition-colors"
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <div className="h-6 w-[1.5px] bg-gray-200 dark:bg-zinc-700 mx-1" />
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
              className="bg-transparent text-sm font-black text-gray-700 dark:text-gray-300 px-4 py-2 outline-none cursor-pointer hover:text-blue-600 transition-colors"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="hidden lg:flex items-center gap-6 px-6 py-3 bg-gray-50 dark:bg-zinc-900/30 rounded-2xl border border-gray-100 dark:border-zinc-800">
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${STATUS_BAR[key]} shadow-lg shadow-black/5`} />
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 bg-white dark:bg-zinc-950" style={{ overflow: 'auto', minWidth: 0, maxWidth: '100%' }}>
        {/* FIX: removed extra wrapper div — minWidth now lives directly on the single content div */}
        <div style={{ minWidth: 280 + (daysInMonth * DAY_WIDTH) }} className="flex flex-col min-h-full">

          {/* Calendar Day Header (Sticky) */}
          <div className="sticky top-0 z-40 flex items-stretch border-b-2 border-gray-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
            <div className="sticky left-0 z-[45] w-[280px] shrink-0 p-8 text-[11px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-[0.2em] border-r border-gray-100 dark:border-zinc-800 flex items-center bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
              Active Missions / Personnel
            </div>
            <div className="flex flex-1">
              {days.map((d, i) => {
                const isToday = new Date().toDateString() === d.toDateString();
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={i}
                    style={{ width: DAY_WIDTH }}
                    className={`shrink-0 flex flex-col items-center justify-center py-4 border-r border-gray-50 dark:border-zinc-800/20
                      ${isWeekend ? 'bg-gray-50/50 dark:bg-zinc-900/10' : ''} ${isToday ? 'bg-blue-600/5 dark:bg-blue-600/10' : ''}`}
                  >
                    <span className={`text-[10px] font-black uppercase ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                      {d.toLocaleDateString('default', { weekday: 'narrow' })}
                    </span>
                    <span className={`text-sm font-black mt-1 ${isToday ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rows */}
          <div className="flex-1 divide-y divide-gray-50 dark:divide-zinc-900/30">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 text-gray-400">
                <FiCalendar size={64} className="opacity-10 mb-6" />
                <p className="text-xs font-black uppercase tracking-[0.5em] opacity-40">No Deployment Activity Recorded</p>
              </div>
            ) : (
              filteredTasks.map((task, rowIdx) => {
                const geo = barGeometry(task._start, task._end);
                return (
                  <div
                    key={task.id}
                    className="flex items-stretch hover:bg-gray-50/50 dark:hover:bg-zinc-900/10 transition-colors group"
                  >
                    {/* Task Anchor Column (Sticky Left) */}
                    <div
                      onClick={() => onTaskClick?.(task)}
                      className="sticky left-0 z-30 w-[280px] shrink-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md flex items-center gap-4 px-8 py-5 border-r border-gray-100 dark:border-zinc-800 cursor-pointer shadow-lg shadow-black/[0.02]"
                    >
                      <div className="relative group/avatar">
                        <MiniAvatar name={task.user} idx={rowIdx} />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full shadow-lg" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-black text-gray-800 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter truncate opacity-70 group-hover:opacity-100 transition-opacity">
                            {task.project || "General Ops"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Canvas area */}
                    <div className="flex-1 relative h-[90px]">
                      {/* Grid Lines Overlay */}
                      <div className="absolute inset-0 flex pointer-events-none opacity-50">
                        {days.map((_, i) => (
                          <div key={i} style={{ width: DAY_WIDTH }} className="shrink-0 border-r border-gray-100 dark:border-zinc-800/10" />
                        ))}
                      </div>

                      {/* Today indicator rail */}
                      {(() => {
                        const todayIdx = days.findIndex(d => d.toDateString() === new Date().toDateString());
                        if (todayIdx === -1) return null;
                        return (
                          <div
                            style={{ left: todayIdx * DAY_WIDTH, width: DAY_WIDTH }}
                            className="absolute inset-0 bg-blue-500/[0.03] dark:bg-blue-400/[0.03] z-0 pointer-events-none border-x border-blue-500/10"
                          />
                        );
                      })()}

                      {/* Task Execution Bar */}
                      {geo && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => onTaskClick?.(task)}
                          style={{ left: geo.left, width: geo.width }}
                          className="absolute top-1/2 -translate-y-1/2 h-12 rounded-[1.2rem]
                            flex flex-col shadow-2xl shadow-black/10 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all z-20 overflow-hidden group/bar border border-white/20 dark:border-white/5"
                        >
                          {/* Visual Color Core */}
                          <div className={`absolute inset-0 ${barColor(task.status)} opacity-20`} />

                          {/* Live Progress Core */}
                          <div
                            className={`absolute inset-y-0 left-0 ${barColor(task.status)} transition-all duration-[1.5s] ease-out shadow-[0_0_30px_rgba(0,0,0,0.2)]`}
                            style={{ width: `${task.progress ?? 0}%` }}
                          />

                          {/* Inner Content */}
                          <div className="relative h-full flex items-center px-4">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <div className="text-[10px] font-black px-2 py-1 bg-white/90 dark:bg-black/40 backdrop-blur-sm rounded-lg shadow-sm">
                                  {task.progress ?? 0}%
                                </div>
                                {task.priority && (
                                  <div className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-wider
                                     ${task.status === 'complete' ? 'bg-emerald-500/20 text-emerald-700' : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300'}
                                   `}>
                                    {STATUS_LABEL[task.status] || task.status}
                                  </div>
                                )}
                              </div>
                              {task.priority === 'urgent' && (
                                <span className="flex h-3 w-3 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Footer Branding ── */}
      <div className="flex-shrink-0 px-10 py-4 bg-gray-50/50 dark:bg-zinc-900/50 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">System Signal Nominal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Operational Core Active</span>
          </div>
        </div>
        <span className="text-[9px] font-black uppercase text-gray-300 dark:text-zinc-700 tracking-[0.2em]">{filteredTasks.length} Active Records</span>
      </div>
    </div>
  );
}
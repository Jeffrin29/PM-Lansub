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
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_BAR: Record<string, string> = {
  "backlog":      "bg-gray-400 dark:bg-gray-500",
  "to do":        "bg-blue-500",
  "in progress":  "bg-orange-400",
  "complete":     "bg-green-500",
};

const STATUS_LABEL: Record<string, string> = {
  "backlog":      "Backlog",
  "to do":        "To Do",
  "in progress":  "In Progress",
  "complete":     "Complete",
};

function barColor(status: string): string {
  return STATUS_BAR[status?.toLowerCase()] ?? "bg-blue-400";
}

function getMonthName(date: Date): string {
  return date.toLocaleString("default", { month: "short", year: "numeric" });
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// ─── Avatar circle ────────────────────────────────────────────────────────────
const PALETTE = ["bg-blue-500","bg-purple-500","bg-green-500","bg-yellow-500","bg-red-500","bg-indigo-500"];
function MiniAvatar({ name, idx }: { name: string; idx: number }) {
  const initials = name.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();
  return (
    <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-[9px] font-bold text-white ${PALETTE[idx % PALETTE.length]}`}>
      {initials}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const MONTHS_VISIBLE = 6;

export default function TasksGanttView({ tasks }: Props) {
  // Timeline anchor — start of the visible window
  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // Build month columns
  const months = useMemo(() => {
    return Array.from({ length: MONTHS_VISIBLE }, (_, i) => addMonths(anchor, i));
  }, [anchor]);

  // Total days in the visible window
  const windowStart = months[0];
  const windowEnd   = useMemo(() => {
    const last = months[months.length - 1];
    return new Date(last.getFullYear(), last.getMonth() + 1, 0); // last day
  }, [months]);
  const totalDays = daysBetween(windowStart, windowEnd) + 1;

  // Tasks enriched with fallback dates
  const enriched = useMemo(() => {
    return tasks.map((t, i) => {
      // Fallbacks: distribute tasks across the current month
      const start = t.startDate
        ? new Date(t.startDate)
        : new Date(windowStart.getFullYear(), windowStart.getMonth(), 1 + (i * 5) % 25);
      const end = t.endDate
        ? new Date(t.endDate)
        : new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
      return { ...t, _start: start, _end: end };
    });
  }, [tasks, windowStart]);

  function barGeometry(start: Date, end: Date): { left: string; width: string } | null {
    const clampedStart = start < windowStart ? windowStart : start;
    const clampedEnd   = end   > windowEnd   ? windowEnd   : end;
    if (clampedStart > windowEnd || clampedEnd < windowStart) return null;

    const offsetDays = daysBetween(windowStart, clampedStart);
    const spanDays   = daysBetween(clampedStart, clampedEnd) + 1;

    const left  = `${(offsetDays / totalDays) * 100}%`;
    const width = `${Math.max((spanDays / totalDays) * 100, 1.5)}%`;
    return { left, width };
  }

  // Month column widths (proportional to days in month)
  const colWidths = useMemo(() => {
    return months.map(m => {
      const days = daysInMonth(m.getFullYear(), m.getMonth());
      return `${(days / totalDays) * 100}%`;
    });
  }, [months, totalDays]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <FiCalendar size={40} className="mb-3 opacity-30" />
        <p className="text-sm">No tasks to display on the timeline.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Task Timeline</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {getMonthName(months[0])} – {getMonthName(months[months.length - 1])}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAnchor(a => addMonths(a, -1))}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500
              hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          >
            <FiChevronLeft size={16} />
          </button>
          <button
            onClick={() => {
              const d = new Date(); d.setDate(1);
              setAnchor(d);
            }}
            className="px-3 h-8 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300
              hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          >
            Today
          </button>
          <button
            onClick={() => setAnchor(a => addMonths(a, 1))}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500
              hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 px-5 py-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40">
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <span key={key} className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <span className={`w-2.5 h-2.5 rounded-sm ${STATUS_BAR[key]}`} />
            {label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 900 }}>

          {/* ── Month Header ── */}
          <div className="flex border-b border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900">
            {/* Task name column */}
            <div className="w-52 shrink-0 px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Task
            </div>
            {/* Month columns */}
            <div className="flex flex-1">
              {months.map((m, i) => (
                <div
                  key={i}
                  style={{ width: colWidths[i] }}
                  className="shrink-0 text-center py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400
                    border-l border-gray-100 dark:border-zinc-800"
                >
                  {getMonthName(m)}
                </div>
              ))}
            </div>
          </div>

          {/* ── Task Rows ── */}
          {enriched.map((task, rowIdx) => {
            const geo = barGeometry(task._start, task._end);
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIdx * 0.03, duration: 0.2 }}
                className="flex items-center border-b border-gray-50 dark:border-zinc-800/60
                  hover:bg-blue-50/30 dark:hover:bg-zinc-800/30 transition-colors group"
              >
                {/* Task info */}
                <div className="w-52 shrink-0 flex items-center gap-2 px-4 py-3">
                  <MiniAvatar name={task.user} idx={rowIdx} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {task.title}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{task.user}</p>
                  </div>
                </div>

                {/* Timeline track */}
                <div className="flex-1 relative h-12 border-l border-gray-100 dark:border-zinc-800">
                  {/* Month separators */}
                  {months.map((_, i) => (
                    <div
                      key={i}
                      style={{ left: colWidths.slice(0, i).reduce((s, w) => s + parseFloat(w), 0) + "%" }}
                      className="absolute top-0 bottom-0 border-l border-gray-100 dark:border-zinc-800"
                    />
                  ))}

                  {/* Today line */}
                  {(() => {
                    const todayOffset = daysBetween(windowStart, new Date());
                    if (todayOffset < 0 || todayOffset > totalDays) return null;
                    return (
                      <div
                        style={{ left: `${(todayOffset / totalDays) * 100}%` }}
                        className="absolute top-0 bottom-0 w-px bg-blue-400/60 z-10"
                      />
                    );
                  })()}

                  {/* Bar */}
                  {geo && (
                    <div
                      style={{ left: geo.left, width: geo.width }}
                      className="absolute top-1/2 -translate-y-1/2 h-6 rounded-full
                        flex items-center px-2 overflow-hidden
                        shadow-sm cursor-pointer hover:brightness-110 transition-all
                        ${barColor(task.status)}"
                    >
                      {/* Use inline style for the actual colour since dynamic classes can't be built with template literals safely */}
                      <div
                        className={`absolute inset-0 rounded-full ${barColor(task.status)} opacity-90`}
                      />
                      <span className="relative z-10 text-[9px] font-bold text-white truncate">
                        {task.title}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

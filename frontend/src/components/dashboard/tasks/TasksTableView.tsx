"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiChevronUp,
  FiChevronDown,
  FiChevronsUp,
  FiAlertTriangle,
  FiFolder,
} from "react-icons/fi";

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
  risk?: string;
}

interface Props {
  tasks: Task[];
  onView?: (t: Task) => void;
  onEdit?: (t: Task) => void;
  onDelete?: (id: string) => void;
}

// ─── Badge helpers ────────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority?: string }) {
  const p = priority?.toLowerCase() ?? "medium";
  const cfg: Record<string, string> = {
    low:    "bg-gray-100 text-gray-500 dark:bg-zinc-700 dark:text-gray-400",
    medium: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    high:   "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    urgent: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  const cls = cfg[p] || (p === 'urgent' ? cfg.urgent : cfg.medium);
  const icons: Record<string, string> = { low: "↓", medium: "→", high: "↑", urgent: "!!" };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${cls}`}>
      <span>{icons[p] ?? "→"}</span>
      {p.charAt(0).toUpperCase() + p.slice(1)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? "";
  const cfg: Record<string, { cls: string; dot: string }> = {
    "backlog":     { cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700/50 dark:text-zinc-300",  dot: "bg-zinc-400" },
    "todo":        { cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",     dot: "bg-blue-400" },
    "to do":       { cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",     dot: "bg-blue-400" },
    "in_progress": { cls: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", dot: "bg-orange-400" },
    "in progress": { cls: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", dot: "bg-orange-400" },
    "complete":    { cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", dot: "bg-emerald-500" },
  };
  const { cls, dot } = cfg[s] ?? cfg["backlog"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : pct >= 25 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-500 dark:text-gray-400 w-7 text-right shrink-0">{pct}%</span>
    </div>
  );
}

function RiskPill({ risk }: { risk?: string }) {
  const r = risk?.toLowerCase() ?? "low";
  const cfg: Record<string, string> = {
    low:    "text-green-600 dark:text-green-400",
    medium: "text-yellow-600 dark:text-yellow-400",
    high:   "text-red-600 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${cfg[r] ?? cfg.low}`}>
      <FiAlertTriangle size={10} />
      {r.charAt(0).toUpperCase() + r.slice(1)}
    </span>
  );
}

function fmt(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Sort helper ──────────────────────────────────────────────────────────────
type SortKey = "title" | "status" | "priority" | "startDate" | "endDate" | "progress";
type SortDir = "asc" | "desc";

function sortTasks(arr: Task[], key: SortKey, dir: SortDir): Task[] {
  return [...arr].sort((a, b) => {
    let av: any = a[key] ?? "";
    let bv: any = b[key] ?? "";
    if (key === "startDate" || key === "endDate") {
      av = av ? new Date(av).getTime() : 0;
      bv = bv ? new Date(bv).getTime() : 0;
    } else if (key === "progress") {
      av = Number(av); bv = Number(bv);
    } else {
      av = String(av).toLowerCase(); bv = String(bv).toLowerCase();
    }
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

// ─── Column header ────────────────────────────────────────────────────────────
function SortableHeader({
  label,
  sortKey,
  active,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const isActive = active === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider
        text-gray-400 dark:text-gray-500 whitespace-nowrap cursor-pointer select-none
        hover:text-gray-600 dark:hover:text-gray-300 transition"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          dir === "asc" ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />
        ) : (
          <FiChevronsUp size={10} className="opacity-40" />
        )}
      </span>
    </th>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

export default function TasksTableView({ tasks, onView, onEdit, onDelete }: Props) {
  const [search, setSearch]   = useState("");
  const [statusF, setStatusF] = useState("All");
  const [prioF,   setPrioF]   = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage]       = useState(1);

  function handleSort(k: SortKey) {
    if (k === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let arr = tasks;
    if (search)       arr = arr.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()));
    if (statusF !== "All") arr = arr.filter(t => t.status?.toLowerCase() === statusF.toLowerCase());
    if (prioF   !== "All") arr = arr.filter(t => t.priority?.toLowerCase() === prioF.toLowerCase());
    return sortTasks(arr, sortKey, sortDir);
  }, [tasks, search, statusF, prioF, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selectCls =
    "h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-700 " +
    "bg-white dark:bg-zinc-800 text-sm text-gray-700 dark:text-gray-200 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search tasks…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-zinc-700
              bg-white dark:bg-zinc-800 text-sm text-gray-700 dark:text-gray-200
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }} className={selectCls}>
          {["All","Backlog","To Do","In Progress","Complete"].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={prioF} onChange={e => { setPrioF(e.target.value); setPage(1); }} className={selectCls}>
          {["All", "Low", "Medium", "High", "Urgent"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Table card ── */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <FiFolder size={36} className="opacity-30" />
            <p className="text-sm">No tasks match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900">
                  <SortableHeader label="Task Name"  sortKey="title"     active={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Project</th>
                  <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Assigned To</th>
                  <SortableHeader label="Priority"   sortKey="priority"  active={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortableHeader label="Status"     sortKey="status"    active={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortableHeader label="Start Date" sortKey="startDate" active={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortableHeader label="End Date"   sortKey="endDate"   active={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortableHeader label="Progress"   sortKey="progress"  active={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Risk</th>
                  <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {paginated.map((task, i) => (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025, duration: 0.18 }}
                    className="group hover:bg-blue-50/40 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Task Name */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onView?.(task)}
                        className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition text-left line-clamp-1 max-w-[160px]"
                      >
                        {task.title}
                      </button>
                    </td>

                    {/* Project */}
                    <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                      {task.project ?? "—"}
                    </td>

                    {/* Assigned */}
                    <td className="py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                      {task.user}
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4">
                      <PriorityBadge priority={task.priority} />
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={task.status} />
                    </td>

                    {/* Start */}
                    <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                      {fmt(task.startDate)}
                    </td>

                    {/* End */}
                    <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                      {fmt(task.endDate)}
                    </td>

                    {/* Progress */}
                    <td className="py-3 px-4 min-w-[120px]">
                      <ProgressBar value={task.progress ?? 0} />
                    </td>

                    {/* Risk */}
                    <td className="py-3 px-4">
                      <RiskPill risk={task.risk} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onView?.(task)}
                          title="View"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                        >
                          <FiEye size={13} />
                        </button>
                        <button
                          onClick={() => onEdit?.(task)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition"
                        >
                          <FiEdit2 size={13} />
                        </button>
                        <button
                          onClick={() => onDelete?.(task.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900">
            <p className="text-xs text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-600 dark:text-gray-300">
                {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-600 dark:text-gray-300">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500
                  hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-medium transition ${
                    safePage === n
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500
                  hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

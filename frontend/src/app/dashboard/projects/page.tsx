"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaProjectDiagram,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFire,
} from "react-icons/fa";
import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiSliders,
  FiX,
  FiAlertCircle,
  FiFolder,
} from "react-icons/fi";

import ProjectsTable from "../../../components/dashboard/projects/ProjectsTable";
import ProjectDetailModal from "../../../components/dashboard/projects/ProjectDetailModal";
import CreateProjectModal from "../../../components/dashboard/projects/CreateProjectModal";
import LifecycleCards from "../../../components/dashboard/projects/LifecycleCards";
import { Project } from "../../../components/dashboard/projects/types";

// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const PAGE_SIZE = 10;

// ─── Token helper ─────────────────────────────────────────────────────────────
function getToken(): string | null {
  try {
    const raw = localStorage.getItem("lansub-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.accessToken ?? parsed?.token ?? null;
  } catch {
    return null;
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  delay?: number;
}

function StatCard({ title, value, icon, gradient, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ scale: 1.03, y: -2 }}
      className={`relative overflow-hidden p-5 rounded-xl text-white shadow-lg bg-gradient-to-br ${gradient}`}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
    </motion.div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-100 dark:bg-zinc-800" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("All");
  const [priorityFilter, setPriority] = useState("All");
  const [ownerFilter, setOwner] = useState("All");

  // Pagination
  const [page, setPage] = useState(1);

  // Modals
  const [viewProject, setViewProject] = useState<Project | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/projects?limit=200`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      const list: Project[] =
        data?.data?.data ?? data?.data ?? data?.projects ?? [];
      setProjects(list);
    } catch (err: any) {
      setError(err.message ?? "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/projects/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p._id !== id));
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      console.error("Delete failed", err);
      setRefreshKey((k) => k + 1);
    }
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter((p) => p.status?.toLowerCase() === "active").length,
    completed: projects.filter((p) => p.status?.toLowerCase() === "completed").length,
    atRisk: projects.filter((p) =>
      ["high", "critical"].includes(p.riskLevel?.toLowerCase() ?? "")
    ).length,
  }), [projects]);

  // ── Owner names for dropdown ──────────────────────────────────────────────────
  const ownerNames = useMemo(() => {
    const names = projects
      .map((p) => (typeof p.owner === "object" ? p.owner?.name ?? "" : p.owner ?? ""))
      .filter(Boolean);
    return ["All", ...Array.from(new Set(names))];
  }, [projects]);

  // ── Filtering ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const nameMatch = search
        ? p.projectTitle?.toLowerCase().includes(search.toLowerCase())
        : true;
      const statusMatch =
        statusFilter === "All" ||
        p.status?.toLowerCase() === statusFilter.toLowerCase();
      const priorityMatch =
        priorityFilter === "All" ||
        p.priority?.toLowerCase() === priorityFilter.toLowerCase();
      const ownerMatch =
        ownerFilter === "All" ||
        (typeof p.owner === "object"
          ? p.owner?.name === ownerFilter
          : p.owner === ownerFilter);
      return nameMatch && statusMatch && priorityMatch && ownerMatch;
    });
  }, [projects, search, statusFilter, priorityFilter, ownerFilter]);

  const hasActiveFilters =
    search !== "" || statusFilter !== "All" || priorityFilter !== "All" || ownerFilter !== "All";

  function resetFilters() {
    setSearch("");
    setStatus("All");
    setPriority("All");
    setOwner("All");
  }

  // ── Pagination ────────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset page whenever filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter, ownerFilter]);

  // ── Lifecycle card filter handler ─────────────────────────────────────────────
  function handleLifecycleFilter(status: string) {
    setStatus(status); // "All" or a stage name like "Active"
    setPage(1);
  }

  // ── Select class ──────────────────────────────────────────────────────────────
  const selectCls =
    "h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-700 " +
    "bg-white dark:bg-zinc-800 text-sm text-gray-700 dark:text-gray-200 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Projects
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="text-sm text-gray-500 dark:text-gray-400 mt-0.5"
          >
            Manage and monitor project execution across your organisation
          </motion.p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Refresh"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg
              border border-gray-200 dark:border-zinc-700
              text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 transition"
          >
            <FiRefreshCw size={15} />
          </button>

          {/* Create Project */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg
              bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition"
          >
            <FiPlus size={15} />
            Create Project
          </motion.button>
        </div>
      </div>

      {/* ── KPI Stat Cards ──────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Overview</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Projects"
            value={stats.total}
            icon={<FaProjectDiagram />}
            gradient="from-blue-500 to-indigo-600"
            delay={0}
          />
          <StatCard
            title="Active Projects"
            value={stats.active}
            icon={<FaFire />}
            gradient="from-violet-500 to-purple-600"
            delay={0.07}
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<FaCheckCircle />}
            gradient="from-emerald-500 to-green-600"
            delay={0.14}
          />
          <StatCard
            title="Projects At Risk"
            value={stats.atRisk}
            icon={<FaExclamationTriangle />}
            gradient="from-red-500 to-orange-500"
            delay={0.21}
          />
        </div>
      </div>

      {/* ── Lifecycle Stage Cards ────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Project Lifecycle</SectionLabel>
        <LifecycleCards
          projects={projects}
          activeFilter={statusFilter}
          onFilterChange={handleLifecycleFilter}
        />
      </div>

      {/* ── Filter Toolbar ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="flex flex-wrap items-center gap-3"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={14}
          />
          <input
            type="text"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-zinc-700
              bg-white dark:bg-zinc-800 text-sm text-gray-700 dark:text-gray-200
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
              focus:border-transparent transition"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          <FiSliders size={13} className="text-gray-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
            className={selectCls}
          >
            {["All", "Draft", "Active", "Review", "Completed", "Archived"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Priority filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriority(e.target.value)}
          className={selectCls}
        >
          {["All", "Low", "Medium", "High"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>

        {/* Owner filter */}
        <select
          value={ownerFilter}
          onChange={(e) => setOwner(e.target.value)}
          className={selectCls}
        >
          {ownerNames.map((o) => <option key={o}>{o}</option>)}
        </select>

        {/* Reset filters */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg
                border border-red-200 dark:border-red-800
                text-red-600 dark:text-red-400 text-xs font-medium
                hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <FiX size={12} />
              Reset
            </motion.button>
          )}
        </AnimatePresence>

        {/* Result count */}
        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} project{filtered.length !== 1 ? "s" : ""}
        </span>
      </motion.div>

      {/* ── Table Card ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm"
      >
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <svg
              className="animate-spin h-8 w-8 text-blue-500 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-sm font-medium">Loading projects…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <FiAlertCircle className="text-red-400" size={28} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-red-500 dark:text-red-400">
                Unable to load projects.
              </p>
              <p className="text-xs text-gray-400 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm
                bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              <FiRefreshCw size={13} />
              Retry
            </button>
          </div>
        )}

        {/* Empty state – no projects at all */}
        {!loading && !error && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <FiFolder className="text-blue-400" size={30} />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
                No projects found.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Get started by creating your first project.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition"
            >
              <FiPlus size={15} />
              Create Project
            </motion.button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && projects.length > 0 && (
          <ProjectsTable
            projects={paginated}
            onView={setViewProject}
            onEdit={(p) => { setEditingProject(p); setShowCreate(true); }}
            onDelete={handleDelete}
          />
        )}

        {/* ── Pagination ─────────────────────────────────────────────────────── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900">
            <p className="text-xs text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-600 dark:text-gray-300">
                {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-600 dark:text-gray-300">
                {filtered.length}
              </span>{" "}
              projects
            </p>

            <div className="flex items-center gap-1">
              {/* Prev */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg
                  text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800
                  disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <FiChevronLeft size={15} />
              </button>

              {/* Page numbers with ellipsis */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .reduce<(number | "…")[]>((acc, n, i, arr) => {
                  if (i > 0 && (n as number) - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === "…" ? (
                    <span
                      key={`e${i}`}
                      className="h-8 w-8 flex items-center justify-center text-xs text-gray-400"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n as number)}
                      className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-medium transition ${safePage === n
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        }`}
                    >
                      {n}
                    </button>
                  )
                )}

              {/* Next */}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="h-8 w-8 flex items-center justify-center rounded-lg
                  text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800
                  disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <FiChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Project Detail Modal ─────────────────────────────────────────────── */}
      {viewProject && (
        <ProjectDetailModal
          project={viewProject}
          onClose={() => setViewProject(null)}
          onEdit={(p) => { setViewProject(null); setEditingProject(p); setShowCreate(true); }}
          onDelete={(id) => { handleDelete(id); setViewProject(null); }}
        />
      )}

      {/* ── Create Project Modal ─────────────────────────────────────────────── */}
      {showCreate && (
        <CreateProjectModal
          project={editingProject}
          onClose={() => { setShowCreate(false); setEditingProject(null); }}
          onCreated={() => { setRefreshKey((k) => k + 1); setEditingProject(null); }}
        />
      )}
    </div>
  );
}
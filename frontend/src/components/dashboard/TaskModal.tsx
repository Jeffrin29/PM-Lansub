"use client";

import { useState, useEffect } from "react";
import { projectsApi, tasksApi, usersDropdownApi } from "../../lib/api";
import { FiX } from "react-icons/fi";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getCurrentUser(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Safe string coercion — prevents ".trim() of undefined" crashes
function safeStr(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  progress: number;
}

const EMPTY_FORM: FormData = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  startDate: "",
  dueDate: "",
  estimatedHours: 0,
  progress: 0,
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function TaskModal({ task, onClose, onSave }: any) {
  const currentUser = getCurrentUser();
  const userRole: string = (
    currentUser?.role?.name || currentUser?.role || "employee"
  )
    .toString()
    .toLowerCase();
  const isEmployee = userRole === "employee";

  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [projects, setProjects]       = useState<any[]>([]);
  const [users, setUsers]             = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedUser, setSelectedUser]       = useState<any>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

  const isEdit = !!task;

  // ── Load projects + users ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Both endpoints are accessible to ALL authenticated users
        const [projRes, usersRes] = await Promise.all([
          projectsApi.getAll(),
          usersDropdownApi.getAll(),
        ]);

        if (cancelled) return;

        // Normalise project list
        const projectList: any[] =
          projRes?.data?.data ?? projRes?.data ?? projRes ?? [];
        console.log("[TaskModal] Projects:", projectList.length);

        // Normalise user list (GET /api/users returns paginated { data: [...] })
        const rawUsers =
          usersRes?.data?.data ?? usersRes?.data ?? usersRes ?? [];
        const userList: any[] = Array.isArray(rawUsers) ? rawUsers : [];
        console.log("[TaskModal] Users:", userList);

        setProjects(projectList);
        setUsers(userList);

        // ── Pre-fill if editing ─────────────────────────────────────────────
        if (task) {
          const matchProject = projectList.find(
            (p: any) => p._id === (task.projectId?._id || task.projectId)
          );
          if (matchProject) setSelectedProject(matchProject);

          const taskAssigneeId =
            task.assignedTo?._id?.toString() || task.assignedTo?.toString();
          const matchUser = userList.find(
            (u: any) => u._id?.toString() === taskAssigneeId
          );
          if (matchUser) setSelectedUser(matchUser);
        } else if (isEmployee && currentUser) {
          // Employee creating a new task → auto-assign to self
          const selfId = currentUser.id || currentUser._id;
          const selfUser = userList.find(
            (u: any) => u._id?.toString() === selfId?.toString()
          );
          if (selfUser) {
            console.log("[TaskModal] Auto-assigned to self:", selfUser.name);
            setSelectedUser(selfUser);
          }
        }
      } catch (err) {
        console.error("[TaskModal] Failed to load dropdown data:", err);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [task]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pre-fill form when editing ────────────────────────────────────────────
  useEffect(() => {
    if (task) {
      setFormData({
        title:          safeStr(task.title),
        description:    safeStr(task.description),
        status:         safeStr(task.status) || "todo",
        priority:       safeStr(task.priority).toLowerCase() || "medium",
        startDate:      task.startDate
          ? new Date(task.startDate).toISOString().split("T")[0]
          : "",
        dueDate:        task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : "",
        estimatedHours: Number(task.estimatedHours) || 0,
        progress:       Number(task.progress) || 0,
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [task]);

  // ── Input handlers ────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "projectId") {
      const p = projects.find((x: any) => x._id === value);
      setSelectedProject(p || null);
      return;
    }

    if (name === "assignedTo") {
      if (isEmployee) return; // employees can't change assignment
      const u = users.find((x: any) => x._id === value);
      setSelectedUser(u || null);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "progress" || name === "estimatedHours"
          ? Number(value)
          : value,
    }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Null-safe validation
    const titleVal = safeStr(formData.title).trim();
    if (!titleVal) {
      setError("Task title is required");
      return;
    }

    const projectId = selectedProject?._id;
    if (!projectId) {
      setError("Please select a project");
      return;
    }

    // assignedTo: use the _id (User._id) directly — task schema refs User
    const assignedTo = selectedUser?._id || null;

    const payload = {
      ...formData,
      title:      titleVal,
      projectId,
      assignedTo,
      status:     safeStr(formData.status).toLowerCase().replace(/\s+/g, "_"),
      priority:   safeStr(formData.priority).toLowerCase(),
    };

    console.log("[TaskModal] Submitting:", payload);
    setLoading(true);

    try {
      if (isEdit) {
        await tasksApi.update(task.id || task._id, payload);
      } else {
        await tasksApi.create(payload);
      }
      onSave();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Unknown error";
      setError("Failed to save task: " + msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEdit ? "Update Task" : "Create New Task"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-all"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              name="projectId"
              value={selectedProject?._id || ""}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="">— Select Project —</option>
              {projects.map((p: any) => (
                <option key={p._id} value={p._id}>
                  {p.name || p.projectTitle || "Untitled"}
                </option>
              ))}
            </select>
            {projects.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">
                Loading projects… or no projects found for your account.
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task name…"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Task details…"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
            />
          </div>

          {/* Status | Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="complete">Complete</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Assigned To | Progress */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Assigned To
              </label>
              <select
                name="assignedTo"
                value={selectedUser?._id || ""}
                onChange={handleChange}
                disabled={isEmployee}
                title={isEmployee ? "Employees are auto-assigned to themselves" : ""}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-60"
              >
                <option value="">— Unassigned —</option>
                {users.map((u: any) => (
                  <option key={u._id} value={u._id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
              {users.length === 0 && (
                <p className="text-xs text-amber-500 mt-1">Loading users…</p>
              )}
              {isEmployee && selectedUser && (
                <p className="text-xs text-blue-500 mt-1">
                  Auto-assigned to you
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Progress (%)
              </label>
              <input
                type="number"
                name="progress"
                min={0}
                max={100}
                value={formData.progress}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Start Date | Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Estimated Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Estimated Hours
            </label>
            <input
              type="number"
              name="estimatedHours"
              min={0}
              value={formData.estimatedHours}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
            >
              {loading ? "Saving…" : isEdit ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { tasksApi } from "../../../lib/api";
import TaskModal from "../../../components/dashboard/TaskModal";
import TasksViewSwitcher, { TaskView } from "../../../components/dashboard/tasks/TasksViewSwitcher";
import TasksKanbanView from "../../../components/dashboard/tasks/TasksKanbanView";
import TasksGanttView from "../../../components/dashboard/tasks/TasksGanttView";
import TasksTableView from "../../../components/dashboard/tasks/TasksTableView";
import { FiPlus, FiFilter, FiRefreshCw } from "react-icons/fi";

// ─── Local task shape ─────────────────────────────────────────────────────────
interface Task {
  id: string;
  _id?: string;
  title: string;
  status: string;
  user: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  progress?: number;
  project?: string;
  risk?: string;
  assignedTo?: any;
  projectId?: any;
  createdBy?: string;
}

// Normalise a backend task object into our local Task shape
function normaliseTask(raw: any, idx: number): Task {
  // Status mapping for UI
  const statusMap: Record<string, string> = {
    "backlog": "Backlog",
    "todo": "To Do",
    "in_progress": "In Progress",
    "complete": "Complete"
  };

  const assignedUser = typeof raw.assignedTo === "object"
    ? (raw.assignedTo?.name ?? "Unassigned")
    : (raw.assignedTo ?? "Unassigned");

  return {
    ...raw,
    id:        raw._id ?? raw.id ?? String(idx),
    title:     raw.title ?? `Task ${idx + 1}`,
    status:    statusMap[raw.status] ?? raw.status ?? "To Do",
    user:      assignedUser,
    priority:  raw.priority ?? "medium",
    startDate: raw.startDate,
    endDate:   raw.dueDate ?? raw.endDate,
    progress:  raw.progress ?? 0,
    project:   typeof raw.projectId === "object"
      ? (raw.projectId?.projectTitle ?? "")
      : (raw.project ?? ""),
    risk:      raw.riskLevel ?? raw.risk ?? "low",
  };
}

// Get current user from localStorage
function getCurrentUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("lansub-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const user = parsed?.user || parsed; // sometimes user is the root object
    return user && typeof user === 'object' ? user : null;
  } catch { return null; }
}

export default function TasksPage() {
  const [currentUser] = useState(() => getCurrentUser());
  const currentUserId = currentUser?._id || currentUser?.id;
  const userRole = (currentUser?.role?.name || currentUser?.role || "employee").toString().toLowerCase();
  const isPrivileged = ["admin", "hr", "project_manager"].includes(userRole);

  const [taskView, setTaskView] = useState<TaskView>("Kanban");
  const [tasks,    setTasks]    = useState<Task[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showModal,    setShowModal]    = useState(false);
  
  // Gantt specific state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear,  setSelectedYear]  = useState(new Date().getFullYear());

  // ── Fetch tasks from API ────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tasksApi.getAll();
      const list: any[] = res?.data?.data ?? res?.data?.tasks ?? res?.tasks ?? [];
      setTasks(list.map((t, i) => normaliseTask(t, i)));
    } catch (err: any) {
      setError(err.message || "Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Kanban drag ─────────────────────────────────────────────────────────────
  async function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const taskId = active.id;
    const newStatusLabel = over.id; // Label from COLUMNS

    // Status mapping backend (reverse)
    const backendStatusMap: Record<string, string> = {
      "Backlog": "backlog",
      "To Do": "todo",
      "In Progress": "in_progress",
      "Complete": "complete"
    };

    const backendStatus = backendStatusMap[newStatusLabel] || "todo";

    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatusLabel } : t));

    try {
      await tasksApi.update(taskId, { status: backendStatus });
      // We don't necessarily need to fetchTasks() here if we trust the optimistic update,
      // but the user wants "Ensure form updates reflect immediately in UI" which we just did.
      // fetchTasks(); 
    } catch (err) {
      console.error("Failed to update status", err);
      fetchTasks();
    }
  }

  // ── Delete task ─────────────────────────────────────────────────────────────
  async function deleteTask(id: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await tasksApi.remove(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert("Failed to delete task: " + err.message);
      await fetchTasks();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Tasks</h1>
            {!loading && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
                {tasks.length}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage, track and organize your team&apos;s work
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchTasks}
            className="p-2.5 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            title="Refresh"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
          </button>
          
          <TasksViewSwitcher active={taskView} onChange={setTaskView} />
          
          <button
            id="add-task-btn"
            onClick={() => { setSelectedTask(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
          >
            <FiPlus size={18} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm p-4 rounded-2xl flex items-center gap-3">
          <span className="text-lg">⚠️</span> 
          <div className="flex-1 font-medium">{error}</div>
          <button onClick={fetchTasks} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors">Retry</button>
        </div>
      )}

      {/* ── Content ── */}
      <div className="relative min-h-[400px]">
        {loading && !tasks.length ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium animate-pulse">Loading workspace…</p>
          </div>
        ) : !tasks.length ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl border-dashed">
            <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 text-4xl">📋</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Workspace Empty</h3>
            <p className="text-sm text-gray-500 mb-8 max-w-xs text-center">Your task list is currently empty. Start by creating a new task for your project.</p>
            <button 
              onClick={() => { setSelectedTask(null); setShowModal(true); }}
              className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl text-sm font-bold transition-transform hover:scale-105"
            >
              Create My First Task
            </button>
          </div>
        ) : (
          <div>
            {taskView === "Kanban" && (
              <TasksKanbanView
                tasks={tasks}
                onTaskClick={(t) => { setSelectedTask(t); setShowModal(true); }}
                onDragEnd={handleDragEnd}
                onAddTask={() => { setSelectedTask(null); setShowModal(true); }}
              />
            )}

            {taskView === "Gantt" && (
              <TasksGanttView 
                tasks={tasks} 
                onTaskClick={(t) => { setSelectedTask(t); setShowModal(true); }}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onMonthChange={setSelectedMonth}
                onYearChange={setSelectedYear}
              />
            )}

            {taskView === "Table" && (
              <TasksTableView
                tasks={tasks}
                onView={(t) => { setSelectedTask(t); setShowModal(true); }}
                onEdit={(t: any) => { 
                  if (!isPrivileged && t.createdBy !== currentUserId && t.assignedTo?._id !== currentUserId) {
                    alert("You can only edit your own tasks.");
                    return;
                  }
                  setSelectedTask(t); 
                  setShowModal(true); 
                }}
                onDelete={(id: string) => {
                  const t = tasks.find(x => x.id === id);
                  if (t && !isPrivileged && t.createdBy !== (currentUserId as any)) {
                    alert("You cannot delete other users' tasks.");
                    return;
                  }
                  deleteTask(id);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Task Modal (Create/Edit) ── */}
      {showModal && (
        <TaskModal
          task={selectedTask}
          onClose={() => { setShowModal(false); setSelectedTask(null); }}
          onSave={fetchTasks}
        />
      )}
    </div>
  );
}

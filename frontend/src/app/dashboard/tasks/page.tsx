"use client";

import { useState, useEffect, useCallback } from "react";
import { tasksApi } from "../../../lib/api";
import TaskDrawer from "../../../components/dashboard/TaskDrawer";
import CreateTaskModal from "../../../components/dashboard/CreateTaskModal";
import TasksViewSwitcher, { TaskView } from "../../../components/dashboard/tasks/TasksViewSwitcher";
import TasksKanbanView from "../../../components/dashboard/tasks/TasksKanbanView";
import TasksGanttView from "../../../components/dashboard/tasks/TasksGanttView";
import TasksTableView from "../../../components/dashboard/tasks/TasksTableView";
import { FiPlus, FiFilter, FiRefreshCw } from "react-icons/fi";

// ─── Local task shape ─────────────────────────────────────────────────────────
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

// Normalise a backend task object into our local Task shape
function normaliseTask(raw: any, idx: number): Task {
  // Status mapping for UI
  const statusMap: Record<string, string> = {
    "todo": "To Do",
    "in_progress": "In Progress",
    "review": "Review",
    "done": "Complete"
  };

  return {
    id:        raw._id ?? raw.id ?? String(idx),
    title:     raw.title ?? `Task ${idx + 1}`,
    status:    statusMap[raw.status] ?? raw.status ?? "To Do",
    user:      typeof raw.assignee === "object"
      ? (raw.assignee?.name ?? "Unassigned")
      : (raw.assignee ?? "Unassigned"),
    priority:  raw.priority ?? "medium",
    startDate: raw.startDate,
    endDate:   raw.dueDate ?? raw.endDate,
    progress:  raw.completionPercentage ?? raw.progress ?? (raw.status === 'done' ? 100 : 0),
    project:   typeof raw.projectId === "object"
      ? (raw.projectId?.projectTitle ?? "")
      : (raw.project ?? ""),
    risk:      raw.riskLevel ?? raw.risk ?? "low",
  };
}

export default function TasksPage() {
  const [taskView, setTaskView] = useState<TaskView>("Kanban");
  const [tasks,    setTasks]    = useState<Task[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showModal,    setShowModal]    = useState(false);

  // ── Fetch tasks from API ────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tasksApi.getAll();
      const list: any[] = res?.data?.data ?? res?.data ?? res?.tasks ?? [];
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
    const newStatus = over.id; // Corrected column id in Kanban

    // Status mapping backend
    const backendStatusMap: Record<string, string> = {
      "Backlog": "todo",
      "To Do": "todo",
      "In Progress": "in_progress",
      "Complete": "done"
    };

    const backendStatus = backendStatusMap[newStatus] || "todo";

    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await tasksApi.update(taskId, { status: backendStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      fetchTasks();
    }
  }

  // ── Create task ─────────────────────────────────────────────────────────────
  async function handleCreateTask(formData: any) {
    try {
      // Backend status mapping
      const statusMap: Record<string, string> = {
        "Backlog": "todo",
        "To Do": "todo",
        "In Progress": "in_progress",
        "Complete": "done"
      };

      await tasksApi.create({
        ...formData,
        status: statusMap[formData.status] ?? "todo",
        priority: formData.priority.toLowerCase(),
        assignee: formData.assignee || null,
      });
      await fetchTasks();
    } catch (err: any) {
      console.error(err);
      alert("Task creation failed: " + err.message);
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
            onClick={() => setShowModal(true)}
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
              onClick={() => setShowModal(true)}
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
                onTaskClick={setSelectedTask}
                onDragEnd={handleDragEnd}
                onAddTask={() => setShowModal(true)}
              />
            )}

            {taskView === "Gantt" && (
              <TasksGanttView tasks={tasks} />
            )}

            {taskView === "Table" && (
              <TasksTableView
                tasks={tasks}
                onView={setSelectedTask}
                onEdit={(t) => setSelectedTask({ ...t, isEdit: true })}
                onDelete={deleteTask}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Task Drawer ── */}
      <TaskDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />

      {/* ── Create Task Modal ── */}
      {showModal && (
        <CreateTaskModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreateTask}
        />
      )}
    </div>
  );
}

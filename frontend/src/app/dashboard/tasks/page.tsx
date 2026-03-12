"use client";

import { useState, useEffect } from "react";
import TaskDrawer from "../../../components/dashboard/TaskDrawer";
import CreateTaskModal from "../../../components/dashboard/CreateTaskModal";
import TasksViewSwitcher, { TaskView } from "../../../components/dashboard/tasks/TasksViewSwitcher";
import TasksKanbanView from "../../../components/dashboard/tasks/TasksKanbanView";
import TasksGanttView from "../../../components/dashboard/tasks/TasksGanttView";
import TasksTableView from "../../../components/dashboard/tasks/TasksTableView";

// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

function getToken(): string | null {
  try {
    const raw = localStorage.getItem("lansub-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.accessToken ?? parsed?.token ?? null;
  } catch { return null; }
}

// ─── Local task shape (merged from local + API) ───────────────────────────────
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
  return {
    id: raw._id ?? raw.id ?? String(idx),
    title: raw.taskTitle ?? raw.title ?? `Task ${idx + 1}`,
    status: raw.status ?? "Backlog",
    user: typeof raw.assignedTo === "object"
      ? (raw.assignedTo?.name ?? "Unknown")
      : (raw.assignedTo ?? raw.user ?? "Unknown"),
    priority: raw.priority ?? "medium",
    startDate: raw.startDate,
    endDate: raw.dueDate ?? raw.endDate,
    progress: raw.completionPercentage ?? raw.progress ?? 0,
    project: typeof raw.project === "object"
      ? (raw.project?.projectTitle ?? "")
      : (raw.project ?? ""),
    risk: raw.riskLevel ?? raw.risk ?? "low",
  };
}

export default function TasksPage() {
  const [taskView, setTaskView] = useState<TaskView>("Kanban");

  // ── Task state (local seed + API merge) ──────────────────────────────────────
  const LOCAL_SEED: Task[] = [
    { id: "1", title: "Task 9", status: "Backlog", user: "John Doe", priority: "low", progress: 0 },
    { id: "2", title: "Task 7", status: "To Do", user: "Maria Smith", priority: "medium", progress: 20 },
    { id: "3", title: "Task 4", status: "In Progress", user: "Alex", priority: "high", progress: 55 },
    { id: "4", title: "Task 2", status: "Complete", user: "David Lee", priority: "medium", progress: 100 },
    { id: "5", title: "Task 8", status: "Backlog", user: "Anna", priority: "low", progress: 0 },
    { id: "6", title: "Task 3", status: "To Do", user: "John Doe", priority: "high", progress: 10 },
  ];

  const [tasks, setTasks] = useState<Task[]>(LOCAL_SEED);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // ── Fetch tasks from API ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/api/tasks?limit=200`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        const list: any[] = data?.data?.data ?? data?.data ?? data?.tasks ?? [];
        if (list.length > 0) {
          setTasks(list.map(normaliseTask));
        }
      } catch { /* keep seed data */ }
    }
    load();
  }, []);

  // ── Kanban drag ───────────────────────────────────────────────────────────────
  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over) return;
    setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: over.id } : t));
  }

  // ── Create task ───────────────────────────────────────────────────────────────
  function createTask(raw: any) {
    setTasks(prev => [...prev, {
      id: raw.id ?? String(Date.now()),
      title: raw.title ?? "Untitled",
      status: raw.status ?? "Backlog",
      user: raw.user ?? "Me",
      priority: raw.priority ?? "medium",
      progress: 0,
    }]);
  }

  // ── Delete task ───────────────────────────────────────────────────────────────
  function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header: Title + View Switcher + Add Task ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {tasks.length} tasks across all stages
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TasksViewSwitcher active={taskView} onChange={setTaskView} />
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 bg-black dark:bg-white text-white dark:text-black
              px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* ── Kanban ───────────────────────────────────────────────────────────── */}
      {taskView === "Kanban" && (
        <TasksKanbanView
          tasks={tasks}
          onTaskClick={setSelectedTask}
          onDragEnd={handleDragEnd}
          onAddTask={() => setShowModal(true)}
        />
      )}

      {/* ── Gantt ────────────────────────────────────────────────────────────── */}
      {taskView === "Gantt" && (
        <TasksGanttView tasks={tasks} />
      )}

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      {taskView === "Table" && (
        <TasksTableView
          tasks={tasks}
          onView={setSelectedTask}
          onEdit={(t) => console.log("edit task", t.id)}
          onDelete={deleteTask}
        />
      )}

      {/* ── Task Drawer ───────────────────────────────────────────────────────── */}
      <TaskDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />

      {/* ── Create Task Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <CreateTaskModal
          onClose={() => setShowModal(false)}
          onCreate={createTask}
        />
      )}
    </div>
  );
}

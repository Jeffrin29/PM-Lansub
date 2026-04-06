"use client";

import { useState, useEffect } from "react";
import { projectsApi, adminApi, tasksApi } from "../../lib/api";
import { FiX, FiCalendar, FiClock, FiUser, FiFlag, FiLayers, FiActivity } from "react-icons/fi";

export default function TaskModal({ task, onClose, onSave }: any) {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const isEdit = !!task;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    status: "todo",
    priority: "medium",
    assignedTo: "",
    startDate: "",
    dueDate: "",
    estimatedHours: 0,
    progress: 0
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [projRes, userRes] = await Promise.all([
          projectsApi.getAll(),
          adminApi.getUsers().catch(() => ({ data: { data: [] } }))
        ]);
        setProjects(projRes?.data?.data ?? projRes?.data ?? []);
        setUsers(userRes?.data?.data ?? userRes?.data ?? []);
      } catch (err) {
        console.error("Failed to fetch dependencies", err);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        projectId: typeof task.projectId === 'string' ? task.projectId : (task.projectId?._id || task.projectId || ""),
        status: task.status || "todo",
        priority: task.priority?.toLowerCase() || "medium",
        assignedTo: typeof task.assignedTo === 'string' ? task.assignedTo : (task.assignedTo?._id || task.assignedTo || ""),
        startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : "",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
        estimatedHours: task.estimatedHours || 0,
        progress: task.progress || 0
      });
    }
  }, [task]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "progress" || name === "estimatedHours" ? Number(value) : value 
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title || !formData.projectId) {
      alert("Title and Project are required");
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await tasksApi.update(task.id || task._id, formData);
      } else {
        await tasksApi.create(formData);
      }
      onSave();
      onClose();
    } catch (err: any) {
      alert("Failed to save task: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in duration-200">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="p-1.5 bg-blue-500 rounded-lg text-white">
              <FiLayers size={18} />
            </span>
            {isEdit ? "Update Task" : "Create New Task"}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Project Selection (Full width) */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiLayers size={12} /> Project *
              </label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                required
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-black text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="">Select a project</option>
                {projects.map((p: any) => (
                  <option key={p._id} value={p._id}>{p.projectTitle}</option>
                ))}
              </select>
            </div>

            {/* Title (Full width) */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Task Title *
              </label>
              <input
                name="title"
                placeholder="e.g. Design System Implementation"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-black text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Description (Full width) */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Briefly describe what needs to be done..."
                value={formData.description}
                onChange={handleChange}
                className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-black text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-black text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="complete">Complete</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiFlag size={12} /> Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-black text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiUser size={12} /> Assigned To
              </label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-black text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="">Unassigned</option>
                {users.map((u: any) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Progress */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FiActivity size={12} /> Progress (%)
                </span>
                <span className="text-blue-600 font-black">{formData.progress}%</span>
              </label>
              <div className="flex items-center gap-3 h-11">
                <input
                  type="range"
                  name="progress"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.progress}
                  onChange={handleChange}
                  className="flex-1 accent-blue-600"
                />
                <input
                  type="number"
                  name="progress"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={handleChange}
                  className="w-16 h-8 text-center text-xs font-bold border border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-100 dark:bg-black"
                />
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiCalendar size={12} /> Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-black text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiCalendar size={12} /> Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-black text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Saving..." : isEdit ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

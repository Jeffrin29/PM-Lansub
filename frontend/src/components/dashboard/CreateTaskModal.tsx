"use client";

import { useState, useEffect } from "react";
import { projectsApi, adminApi } from "../../lib/api";
import { FiX, FiCalendar, FiClock, FiUser, FiFlag, FiLayers } from "react-icons/fi";

export default function CreateTaskModal({ onClose, onCreate }: any) {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    status: "To Do",
    priority: "Medium",
    assignee: "",
    startDate: "",
    dueDate: "",
    estimatedHours: ""
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [projRes, userRes] = await Promise.all([
          projectsApi.getAll(),
          adminApi.getUsers()
        ]);
        setProjects(projRes?.data?.data ?? projRes?.data ?? []);
        setUsers(userRes?.data?.data ?? userRes?.data ?? []);
      } catch (err) {
        console.error("Failed to fetch projects/users", err);
      }
    }
    fetchData();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title || !formData.projectId) {
      alert("Title and Project are required");
      return;
    }
    onCreate(formData);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/20">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="p-1.5 bg-blue-500 rounded-lg text-white">
              <FiLayers size={18} />
            </span>
            Create New Task
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
                <option>Backlog</option>
                <option>To Do</option>
                <option>In Progress</option>
                <option>Complete</option>
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
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiUser size={12} /> Assignee
              </label>
              <select
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-black text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="">Unassigned</option>
                {users.map((u: any) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Estimated Hours */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiClock size={12} /> Estimated Hours
              </label>
              <input
                type="number"
                name="estimatedHours"
                placeholder="0"
                value={formData.estimatedHours}
                onChange={handleChange}
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-black text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
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

          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { projectsApi, adminApi, tasksApi } from "../../lib/api";
import { FiX, FiCalendar, FiClock, FiUser, FiFlag, FiLayers, FiActivity } from "react-icons/fi";

export default function TaskModal({ task, onClose, onSave }: any) {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Storing full objects as requested
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedUser,    setSelectedUser]    = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    startDate: "",
    dueDate: "",
    estimatedHours: 0,
    progress: 0
  });

  const isEdit = !!task;

  useEffect(() => {
    async function fetchData() {
      try {
        const [projRes, userRes] = await Promise.all([
          projectsApi.getAll(),
          adminApi.getUsers().catch(() => ({ data: { data: [] } }))
        ]);
        const projectList = projRes?.data?.data ?? projRes?.data ?? [];
        const userList = userRes?.data?.data ?? userRes?.data ?? [];
        setProjects(projectList);
        setUsers(userList);

        // If editing, map initial objects
        if (task) {
          const p = projectList.find((x: any) => x._id === (task.projectId?._id || task.projectId));
          const u = userList.find((x: any) => x._id === (task.assignedTo?._id || task.assignedTo));
          if (p) setSelectedProject(p);
          if (u) setSelectedUser(u);
        }
      } catch (err) {
        console.error("Failed to fetch dependencies", err);
      }
    }
    fetchData();
  }, [task]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority?.toLowerCase() || "medium",
        startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : "",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
        estimatedHours: task.estimatedHours || 0,
        progress: task.progress || 0
      });
    }
  }, [task]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    
    if (name === "projectId") {
      const p = projects.find(x => x._id === value);
      setSelectedProject(p || null);
    } else if (name === "assignedTo") {
      const u = users.find(x => x._id === value);
      setSelectedUser(u || null);
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: name === "progress" || name === "estimatedHours" ? Number(value) : value 
      }));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Extract _id before sending API request as requested
    const projectId = selectedProject?._id;
    const assignedTo = selectedUser?._id;

    if (!formData.title || !projectId) {
      alert("Title and Project are required");
      return;
    }

    setLoading(true);

    // Normalize before API call
    const payload = {
      ...formData,
      projectId,
      assignedTo: assignedTo || null,
      status: formData.status.toLowerCase().replace(/\s+/g, "_"), // e.g. "In Progress" -> "in_progress"
      priority: formData.priority.toLowerCase() // "High" -> "high"
    };

    try {
      if (isEdit) {
        await tasksApi.update(task.id || task._id, payload);
      } else {
        await tasksApi.create(payload);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 font-sans">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in duration-200">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
              <FiLayers size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                {isEdit ? "Refine Task" : "Assemble Task"}
              </h2>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">Task Engineering Unit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Project Selection */}
            <div className="md:col-span-2 group">
              <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-blue-500 transition-colors">
                Parent Project *
              </label>
              <select
                name="projectId"
                value={selectedProject?._id || ""}
                onChange={handleChange}
                required
                className="w-full h-14 px-5 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-black text-sm font-bold transition-all focus:border-blue-500 outline-none appearance-none"
              >
                <option value="">Select Target project</option>
                {projects.map((p: any) => (
                  <option key={p._id} value={p._id}>{p.projectTitle}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="md:col-span-2 group">
              <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-blue-500 transition-colors">
                Mission Title *
              </label>
              <input
                name="title"
                placeholder="Describe the primary objective..."
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full h-14 px-5 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-black text-sm font-bold transition-all focus:border-blue-500 outline-none placeholder:text-gray-300 dark:placeholder:text-zinc-700"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2 group">
              <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-blue-500 transition-colors">
                Strategic Brief
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Outline technical requirements or context..."
                value={formData.description}
                onChange={handleChange}
                className="w-full p-5 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-black text-sm font-bold transition-all focus:border-blue-500 outline-none resize-none placeholder:text-gray-300 dark:placeholder:text-zinc-700"
              />
            </div>

            {/* Status */}
            <div className="group">
              <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-blue-500 transition-colors">
                Deployment Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-black text-sm font-bold transition-all focus:border-blue-500 outline-none"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="complete">Complete</option>
              </select>
            </div>

            {/* Priority */}
            <div className="group">
              <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-blue-500 transition-colors">
                Priority Matrix
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-black text-sm font-bold transition-all focus:border-blue-500 outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">CRITICAL (Urgent)</option>
              </select>
            </div>

            {/* Assignee */}
            <div className="group">
              <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-blue-500 transition-colors">
                Operational Lead
              </label>
              <select
                name="assignedTo"
                value={selectedUser?._id || ""}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-black text-sm font-bold transition-all focus:border-blue-500 outline-none"
              >
                <option value="">Unassigned</option>
                {users.map((u: any) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Progress */}
            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] group-focus-within:text-blue-500 transition-colors">
                  Progress Percentage
                </label>
                <span className="text-sm font-black text-blue-600">{formData.progress}%</span>
              </div>
              <div className="flex items-center gap-4 h-14">
                <input
                  type="range"
                  name="progress"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.progress}
                  onChange={handleChange}
                  className="flex-1 h-2 bg-gray-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600 border-none"
                />
                <input
                  type="number"
                  name="progress"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={handleChange}
                  className="w-20 h-10 text-center text-sm font-bold border-2 border-gray-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-black"
                />
              </div>
            </div>

            {/* Start Date */}
            <div className="group">
              <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-blue-500 transition-colors">
                Commencement Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full h-14 px-5 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-black text-sm font-bold transition-all focus:border-blue-500 outline-none color-scheme-light dark:color-scheme-dark"
                />
              </div>
            </div>

            {/* Due Date */}
            <div className="group">
              <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-blue-500 transition-colors">
                Deadline
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full h-14 px-5 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-black text-sm font-bold transition-all focus:border-blue-500 outline-none color-scheme-light dark:color-scheme-dark"
                />
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3.5 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 text-sm font-black text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black shadow-2xl shadow-blue-600/30 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:pointer-events-none uppercase tracking-widest"
            >
              {loading ? "Synchronizing..." : isEdit ? "Update Mission" : "Authorize Mission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

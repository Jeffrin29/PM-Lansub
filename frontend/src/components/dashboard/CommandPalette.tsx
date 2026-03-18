"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: string;
  action: () => void;
  category: string;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Toggle on Ctrl+K or Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const commands: CommandItem[] = [
    // Navigation
    { id: "nav-dashboard", category: "Navigate", label: "Dashboard", description: "Go to main dashboard", icon: "📊", action: () => { router.push("/dashboard"); setOpen(false); } },
    { id: "nav-overview", category: "Navigate", label: "Overview", description: "Workspace overview", icon: "🌐", action: () => { router.push("/dashboard/overview"); setOpen(false); } },
    { id: "nav-projects", category: "Navigate", label: "Projects", description: "View all projects", icon: "📁", action: () => { router.push("/dashboard/projects"); setOpen(false); } },
    { id: "nav-tasks", category: "Navigate", label: "Tasks", description: "View all tasks", icon: "✅", action: () => { router.push("/dashboard/tasks"); setOpen(false); } },
    { id: "nav-timesheets", category: "Navigate", label: "Timesheets", description: "Manage time logs", icon: "⏱", action: () => { router.push("/dashboard/timesheets"); setOpen(false); } },
    { id: "nav-reports", category: "Navigate", label: "Reports", description: "Analytics & reports", icon: "📈", action: () => { router.push("/dashboard/reports"); setOpen(false); } },
    { id: "nav-notifications", category: "Navigate", label: "Notifications", description: "View notifications", icon: "🔔", action: () => { router.push("/dashboard/notif"); setOpen(false); } },
    { id: "nav-activity", category: "Navigate", label: "Activity Feed", description: "Recent activity", icon: "📋", action: () => { router.push("/dashboard/activity"); setOpen(false); } },
    { id: "nav-discussions", category: "Navigate", label: "Discussions", description: "Team discussions", icon: "💬", action: () => { router.push("/dashboard/discussions"); setOpen(false); } },
    { id: "nav-admin", category: "Navigate", label: "Admin Panel", description: "Manage users & settings", icon: "⚙️", action: () => { router.push("/dashboard/admin"); setOpen(false); } },
    // Actions
    { id: "action-create-project", category: "Actions", label: "Create Project", description: "Start a new project", icon: "🚀", action: () => { router.push("/dashboard/projects"); setOpen(false); } },
    { id: "action-create-task", category: "Actions", label: "Create Task", description: "Add a new task", icon: "➕", action: () => { router.push("/dashboard/tasks"); setOpen(false); } },
    { id: "action-log-time", category: "Actions", label: "Log Time", description: "Submit a timesheet entry", icon: "⏰", action: () => { router.push("/dashboard/timesheets"); setOpen(false); } },
    { id: "action-new-discussion", category: "Actions", label: "New Discussion", description: "Start a team discussion", icon: "💡", action: () => { router.push("/dashboard/discussions"); setOpen(false); } },
  ];

  const filtered = search
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase()) ||
          c.category.toLowerCase().includes(search.toLowerCase())
      )
    : commands;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {});

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-700 overflow-hidden"
        style={{ animation: "slideDown 0.15s ease-out" }}
      >
        <Command
          label="Command Palette"
          className="[&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-gray-100 dark:[&_[cmdk-input-wrapper]]:border-zinc-800"
        >
          {/* Search */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-zinc-800">
            <span className="text-gray-400 text-lg">🔍</span>
            <Command.Input
              id="command-palette-input"
              autoFocus
              placeholder="Search commands…"
              value={search}
              onValueChange={setSearch}
              className="flex-1 bg-transparent text-gray-900 dark:text-white text-sm placeholder-gray-400 outline-none"
            />
            <kbd className="text-xs text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-mono">
              ESC
            </kbd>
          </div>

          {/* List */}
          <Command.List className="max-h-96 overflow-y-auto py-2">
            <Command.Empty className="text-center text-sm text-gray-400 py-8">
              No commands found
            </Command.Empty>

            {Object.entries(grouped).map(([category, items]) => (
              <Command.Group key={category} heading={category}>
                <div className="px-4 py-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-1">
                    {category}
                  </p>
                </div>
                {items.map((item) => (
                  <Command.Item
                    key={item.id}
                    id={item.id}
                    value={item.label}
                    onSelect={item.action}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-zinc-800 transition data-[selected=true]:bg-blue-50 dark:data-[selected=true]:bg-zinc-800 mx-2 rounded-xl mb-1"
                  >
                    <span className="text-xl w-8 text-center">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                      )}
                    </div>
                    <kbd className="text-xs text-gray-300 dark:text-gray-600">↵</kbd>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">↵</kbd> select</span>
            <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">ctrl+K</kbd> toggle</span>
          </div>
        </Command>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity:0; transform: translateY(-8px); }
          to { opacity:1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

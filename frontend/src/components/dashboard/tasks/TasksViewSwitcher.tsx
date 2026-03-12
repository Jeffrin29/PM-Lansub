"use client";

import React from "react";
import { FiGrid, FiBarChart2, FiList } from "react-icons/fi";

export type TaskView = "Kanban" | "Gantt" | "Table";

const VIEWS: { key: TaskView; label: string; icon: React.ReactNode }[] = [
  { key: "Kanban", label: "Kanban", icon: <FiGrid size={14} /> },
  { key: "Gantt",  label: "Gantt",  icon: <FiBarChart2 size={14} /> },
  { key: "Table",  label: "Table",  icon: <FiList size={14} /> },
];

interface Props {
  active: TaskView;
  onChange: (v: TaskView) => void;
}

export default function TasksViewSwitcher({ active, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
      {VIEWS.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
            ${active === key
              ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}

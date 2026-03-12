"use client";

import React from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import Avatar from "../Avatar";

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

const COLUMNS = ["Backlog", "To Do", "In Progress", "Complete"];

const COL_COLOR: Record<string, string> = {
  "Backlog":     "bg-gray-400",
  "To Do":       "bg-red-500",
  "In Progress": "bg-blue-500",
  "Complete":    "bg-green-500",
};

interface Props {
  tasks: Task[];
  onTaskClick: (t: Task) => void;
  onDragEnd: (event: any) => void;
  onAddTask: () => void;
}

export default function TasksKanbanView({ tasks, onTaskClick, onDragEnd, onAddTask }: Props) {
  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-4 gap-6">
        {COLUMNS.map((column) => (
          <div
            key={column}
            id={column}
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 min-h-[520px]"
          >
            {/* Column Header */}
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${COL_COLOR[column]}`} />
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {column}
                  </h2>
                </div>
                <span className="text-xs bg-gray-200 dark:bg-zinc-800 px-2 py-1 rounded">
                  {tasks.filter((t) => t.status === column).length}
                </span>
              </div>
            </div>

            {/* Task Cards */}
            <div className="space-y-4">
              {tasks
                .filter((task) => task.status === column)
                .map((task) => (
                  <div
                    key={task.id}
                    id={task.id}
                    onClick={() => onTaskClick(task)}
                    className="bg-gray-100 dark:bg-black border border-gray-200 dark:border-zinc-800 p-4 rounded-lg cursor-grab hover:shadow-xl hover:scale-[1.02] transition-all"
                  >
                    <p className="font-medium text-sm">{task.title}</p>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded mt-2 inline-block">
                      Feature
                    </span>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xs text-gray-400">TASK</span>
                      <Avatar name={task.user} />
                    </div>
                  </div>
                ))}
            </div>

            {/* Add Task */}
            <button
              onClick={onAddTask}
              className="mt-4 text-sm text-green-500 hover:underline"
            >
              + Add Task
            </button>
          </div>
        ))}
      </div>
    </DndContext>
  );
}

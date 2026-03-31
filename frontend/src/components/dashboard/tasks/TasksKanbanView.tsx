"use client";

import React from "react";
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Avatar from "../Avatar";
import { FiFlag, FiPlus } from "react-icons/fi";

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
  "Backlog": "bg-gray-400",
  "To Do": "bg-blue-500",
  "In Progress": "bg-orange-500",
  "Complete": "bg-emerald-500",
};

interface Props {
  tasks: Task[];
  onTaskClick: (t: Task) => void;
  onDragEnd: (event: any) => void;
  onAddTask: () => void;
}

function SortableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColor = (p?: string) => {
    const s = p?.toLowerCase();
    if (s === 'urgent') return 'text-red-500 bg-red-50 dark:bg-red-900/20';
    if (s === 'high') return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
    if (s === 'medium') return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50 p-4 rounded-2xl cursor-grab active:cursor-grabbing hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5 transition-all duration-200 ${isDragging ? 'z-50' : ''}`}
    >
      <div className="space-y-3">
        {task.priority && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityColor(task.priority)}`}>
            <FiFlag size={10} />
            {task.priority}
          </span>
        )}

        <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {task.title}
        </h3>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Avatar name={task.user} />
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate max-w-[80px]">
              {task.user}
            </span>
          </div>
          <div className="text-[10px] font-bold text-gray-300 dark:text-zinc-600 uppercase tracking-tighter">
            #{task.id.slice(-4)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TasksKanbanView({ tasks, onTaskClick, onDragEnd, onAddTask }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {COLUMNS.map((column) => (
          <div
            key={column}
            id={column}
            className="flex flex-col h-full min-h-[600px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${COL_COLOR[column]}`} />
                <h2 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  {column}
                </h2>
                <span className="bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {tasks.filter((t) => t.status === column).length}
                </span>
              </div>
              <button onClick={onAddTask} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400 transition-colors">
                <FiPlus size={16} />
              </button>
            </div>

            {/* Droppable Area / Sortable Context */}
            <div className="flex-1 bg-gray-50/50 dark:bg-zinc-900/30 border border-gray-100 dark:border-zinc-800/50 rounded-3xl p-3 space-y-3">
              <SortableContext
                id={column}
                items={tasks.filter(t => t.status === column).map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {tasks
                  .filter((task) => task.status === column)
                  .map((task) => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick(task)}
                    />
                  ))}
              </SortableContext>

              {tasks.filter(t => t.status === column).length === 0 && (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl">
                  <p className="text-[11px] font-bold text-gray-300 dark:text-zinc-700 uppercase tracking-widest">Drop here</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </DndContext>
  );
}

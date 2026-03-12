import React from "react";

export type ProjectStatus = "Draft" | "Active" | "Review" | "Completed" | "Archived";

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; className: string; dot: string }
> = {
  Draft:     { label: "Draft",     className: "bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-gray-300",       dot: "bg-gray-400"   },
  Active:    { label: "Active",    className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",     dot: "bg-blue-500"   },
  Review:    { label: "Review",    className: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", dot: "bg-purple-500" },
  Completed: { label: "Completed", className: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300", dot: "bg-green-500"  },
  Archived:  { label: "Archived",  className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",       dot: "bg-zinc-400"   },
};

interface Props {
  status: ProjectStatus;
}

export default function ProjectStatusBadge({ status }: Props) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Draft;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

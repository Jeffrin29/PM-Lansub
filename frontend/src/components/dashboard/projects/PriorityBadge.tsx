import React from "react";

export type ProjectPriority = "low" | "medium" | "high";

const PRIORITY_CONFIG: Record<
  ProjectPriority,
  { label: string; className: string }
> = {
  low:    { label: "Low",    className: "bg-gray-100 text-gray-500 dark:bg-zinc-700 dark:text-gray-400"         },
  medium: { label: "Medium", className: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  high:   { label: "High",   className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"           },
};

interface Props {
  priority: ProjectPriority | string;
}

export default function PriorityBadge({ priority }: Props) {
  const key = priority?.toLowerCase() as ProjectPriority;
  const cfg = PRIORITY_CONFIG[key] ?? PRIORITY_CONFIG.medium;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

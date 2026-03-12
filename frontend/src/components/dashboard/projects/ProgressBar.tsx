import React from "react";

interface Props {
  value: number; // 0-100
}

function barColor(v: number): string {
  if (v >= 80) return "bg-green-500";
  if (v >= 50) return "bg-blue-500";
  if (v >= 25) return "bg-yellow-500";
  return "bg-red-400";
}

export default function ProgressBar({ value }: Props) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right shrink-0">
        {pct}%
      </span>
    </div>
  );
}

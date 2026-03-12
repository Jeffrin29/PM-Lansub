"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FiFileText,
  FiZap,
  FiSearch,
  FiCheckSquare,
  FiArchive,
} from "react-icons/fi";
import { Project } from "./types";

// ─── Config ───────────────────────────────────────────────────────────────────
interface StageConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  cardBg: string;
  iconBg: string;
  iconColor: string;
  badge: string;
  badgeText: string;
  border: string;
  ring: string;
}

const STAGES: StageConfig[] = [
  {
    key: "draft",
    label: "Draft",
    icon: <FiFileText size={18} />,
    cardBg:
      "bg-gray-50 dark:bg-zinc-800/60 hover:bg-gray-100 dark:hover:bg-zinc-800",
    iconBg: "bg-gray-200 dark:bg-zinc-700",
    iconColor: "text-gray-500 dark:text-gray-400",
    badge: "bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-300",
    badgeText: "Draft",
    border: "border-gray-200 dark:border-zinc-700",
    ring: "ring-gray-300 dark:ring-zinc-600",
  },
  {
    key: "active",
    label: "Active",
    icon: <FiZap size={18} />,
    cardBg:
      "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
    badgeText: "Active",
    border: "border-blue-200 dark:border-blue-800",
    ring: "ring-blue-300 dark:ring-blue-700",
  },
  {
    key: "review",
    label: "Review",
    icon: <FiSearch size={18} />,
    cardBg:
      "bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    iconColor: "text-purple-600 dark:text-purple-400",
    badge:
      "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
    badgeText: "Review",
    border: "border-purple-200 dark:border-purple-800",
    ring: "ring-purple-300 dark:ring-purple-700",
  },
  {
    key: "completed",
    label: "Completed",
    icon: <FiCheckSquare size={18} />,
    cardBg:
      "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30",
    iconBg: "bg-green-100 dark:bg-green-900/40",
    iconColor: "text-green-600 dark:text-green-400",
    badge:
      "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
    badgeText: "Completed",
    border: "border-green-200 dark:border-green-800",
    ring: "ring-green-300 dark:ring-green-700",
  },
  {
    key: "archived",
    label: "Archived",
    icon: <FiArchive size={18} />,
    cardBg:
      "bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80",
    iconBg: "bg-zinc-200 dark:bg-zinc-700",
    iconColor: "text-zinc-500 dark:text-zinc-400",
    badge: "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400",
    badgeText: "Archived",
    border: "border-zinc-300 dark:border-zinc-700",
    ring: "ring-zinc-400 dark:ring-zinc-600",
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  projects: Project[];
  activeFilter: string;
  onFilterChange: (status: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LifecycleCards({
  projects,
  activeFilter,
  onFilterChange,
}: Props) {
  // Count projects per stage (case-insensitive)
  const counts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const stage of STAGES) map[stage.key] = 0;
    for (const p of projects) {
      const key = p.status?.toLowerCase();
      if (key && key in map) map[key]++;
    }
    return map;
  }, [projects]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {STAGES.map((stage, i) => {
        const isActive =
          activeFilter.toLowerCase() === stage.key;

        return (
          <motion.button
            key={stage.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              onFilterChange(isActive ? "All" : stage.label)
            }
            className={`
              relative flex flex-col gap-3 p-4 rounded-xl border
              text-left cursor-pointer transition-all duration-200
              ${stage.cardBg} ${stage.border}
              ${isActive ? `ring-2 ${stage.ring} shadow-md` : "shadow-sm"}
            `}
          >
            {/* Icon */}
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center
                ${stage.iconBg} ${stage.iconColor}`}
            >
              {stage.icon}
            </div>

            {/* Count */}
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                {counts[stage.key]}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {stage.label}
              </p>
            </div>

            {/* Badge */}
            <span
              className={`self-start inline-flex items-center px-2 py-0.5 rounded-full
                text-[10px] font-semibold uppercase tracking-wide
                ${stage.badge}`}
            >
              {stage.badgeText}
            </span>

            {/* Active indicator dot */}
            {isActive && (
              <span
                className={`absolute top-3 right-3 w-2 h-2 rounded-full
                  ${stage.iconColor.replace("text-", "bg-")}`}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

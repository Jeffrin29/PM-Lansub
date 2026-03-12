"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";
import { FaRegFolderOpen } from "react-icons/fa";
import ProjectStatusBadge from "./ProjectStatusBadge";
import PriorityBadge from "./PriorityBadge";
import RiskIndicator from "./RiskIndicator";
import ProgressBar from "./ProgressBar";
import TeamAvatars from "./TeamAvatars";
import { Project } from "./types";

interface Props {
  projects: Project[];
  onView: (p: Project) => void;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}

function fmt(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ownerName(owner: Project["owner"]): string {
  if (!owner) return "—";
  if (typeof owner === "object") return owner.name ?? "—";
  return owner;
}

const COL_HEADERS = [
  "Project Name",
  "Description",
  "Owner",
  "Team",
  "Status",
  "Priority",
  "Start",
  "End",
  "Completion",
  "Risk",
  "Files",
  "Actions",
];

export default function ProjectsTable({ projects, onView, onEdit, onDelete }: Props) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <FaRegFolderOpen className="text-5xl mb-4 opacity-30" />
        <p className="text-sm font-medium">No projects found.</p>
        <p className="text-xs mt-1 opacity-60">Try adjusting your filters or create a new project.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[1200px]">
        {/* ─── Sticky Header ─── */}
        <thead>
          <tr className="text-xs uppercase text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900">
            {COL_HEADERS.map((h) => (
              <th
                key={h}
                className="text-left py-3 px-4 font-semibold tracking-wide whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        {/* ─── Body ─── */}
        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
          {projects.map((p, i) => (
            <motion.tr
              key={p._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className="group hover:bg-blue-50/40 dark:hover:bg-zinc-800/40 transition-colors duration-150"
            >
              {/* Project Name */}
              <td className="py-3.5 px-4">
                <button
                  onClick={() => onView(p)}
                  className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition text-left line-clamp-1 max-w-[180px]"
                >
                  {p.projectTitle}
                </button>
              </td>

              {/* Description */}
              <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 max-w-[200px]">
                <span className="line-clamp-1 text-xs">{p.description ?? "—"}</span>
              </td>

              {/* Owner */}
              <td className="py-3.5 px-4">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {ownerName(p.owner)}
                </span>
              </td>

              {/* Team */}
              <td className="py-3.5 px-4">
                <TeamAvatars members={p.assignedTeam ?? []} max={4} />
              </td>

              {/* Status */}
              <td className="py-3.5 px-4">
                <ProjectStatusBadge status={p.status as any} />
              </td>

              {/* Priority */}
              <td className="py-3.5 px-4">
                <PriorityBadge priority={p.priority ?? "low"} />
              </td>

              {/* Start Date */}
              <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {fmt(p.startDate)}
              </td>

              {/* End Date */}
              <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {fmt(p.endDate)}
              </td>

              {/* Completion */}
              <td className="py-3.5 px-4 min-w-[120px]">
                <ProgressBar value={p.completionPercentage ?? 0} />
              </td>

              {/* Risk */}
              <td className="py-3.5 px-4">
                <RiskIndicator level={p.riskLevel ?? "low"} />
              </td>

              {/* Attachments */}
              <td className="py-3.5 px-4">
                {(p.attachments ?? []).length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                    <FaRegFolderOpen />
                    {p.attachments!.length}
                  </span>
                ) : (
                  <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                )}
              </td>

              {/* Actions */}
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onView(p)}
                    title="View"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                  >
                    <FiEye size={14} />
                  </button>
                  <button
                    onClick={() => onEdit(p)}
                    title="Edit"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(p._id)}
                    title="Delete"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

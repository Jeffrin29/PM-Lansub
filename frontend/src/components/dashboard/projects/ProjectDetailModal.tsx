"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { Project } from "./types";
import ProjectStatusBadge from "./ProjectStatusBadge";
import PriorityBadge from "./PriorityBadge";
import RiskIndicator from "./RiskIndicator";
import ProgressBar from "./ProgressBar";
import TeamAvatars from "./TeamAvatars";
import { FaRegFolderOpen } from "react-icons/fa";

interface Props {
  project: Project;
  onClose: () => void;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}

function fmt(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function ProjectDetailModal({ project, onClose, onEdit, onDelete }: Props) {
  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {project.name || project.projectTitle}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Project Detail
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {project.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {project.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-1">Owner</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {typeof project.owner === "object"
                    ? (project.owner as { name?: string }).name ?? "—"
                    : project.owner ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Status</p>
                <ProjectStatusBadge status={project.status as any} />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Priority</p>
                <PriorityBadge priority={project.priority ?? ""} />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Risk Level</p>
                <RiskIndicator level={project.riskLevel ?? "low"} />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Start Date</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">{fmt(project.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">End Date</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">{fmt(project.endDate)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-2">Completion</p>
              <ProgressBar value={project.completion ?? 0} />
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-2">Team</p>
              <TeamAvatars members={project.teamMembers ?? []} />
            </div>

            {project.attachments && project.attachments.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Attachments</p>
                <div className="space-y-1">
                  {project.attachments.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                      <FaRegFolderOpen />
                      <span>{a.originalName ?? a.filename ?? `File ${i + 1}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-100 dark:border-zinc-800">
            <button
              onClick={() => { onDelete(project._id); onClose(); }}
              className="px-4 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 transition"
            >
              Delete
            </button>
            <button
              onClick={() => { onEdit(project); onClose(); }}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              Edit Project
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

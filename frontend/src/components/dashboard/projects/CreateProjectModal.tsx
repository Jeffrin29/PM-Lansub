"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiUpload,
  FiPlusCircle,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const STATUS_OPTIONS  = ["Draft","Active","Review","Completed","Archived"];
const PRIORITY_OPTIONS = ["Low","Medium","High"];
const RISK_OPTIONS    = ["Low","Medium","High"];

// ─── Token helper ─────────────────────────────────────────────────────────────
function getToken(): string | null {
  try {
    const raw = localStorage.getItem("lansub-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.accessToken ?? parsed?.token ?? null;
  } catch {
    return null;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
  onCreated: () => void;
}

interface FormState {
  projectTitle: string;
  description: string;
  owner: string;
  teamInput: string;          // comma-separated names
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  completionPercentage: string;
  riskLevel: string;
}

// ─── Field helpers ────────────────────────────────────────────────────────────
const inputCls =
  "w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-zinc-700 " +
  "bg-white dark:bg-zinc-800 text-sm text-gray-800 dark:text-gray-100 " +
  "placeholder-gray-400 dark:placeholder-gray-500 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const selectCls =
  "w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-zinc-700 " +
  "bg-white dark:bg-zinc-800 text-sm text-gray-800 dark:text-gray-100 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CreateProjectModal({ onClose, onCreated }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    projectTitle: "",
    description: "",
    owner: "",
    teamInput: "",
    status: "Draft",
    priority: "Medium",
    startDate: "",
    endDate: "",
    completionPercentage: "0",
    riskLevel: "Low",
  });

  const [files, setFiles]       = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!form.projectTitle.trim()) {
      setSubmitError("Project name is required.");
      return;
    }

    setSubmitting(true);

    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      let body: FormData | string;
      let contentType: string | undefined;

      if (files.length > 0) {
        // Multipart for file uploads
        const fd = new FormData();
        fd.append("projectTitle",         form.projectTitle.trim());
        fd.append("description",          form.description.trim());
        fd.append("owner",                form.owner.trim());
        fd.append("status",               form.status);
        fd.append("priority",             form.priority.toLowerCase());
        fd.append("startDate",            form.startDate);
        fd.append("endDate",              form.endDate);
        fd.append("completionPercentage", form.completionPercentage);
        fd.append("riskLevel",            form.riskLevel.toLowerCase());

        // Team as JSON string
        const teamArr = form.teamInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ name }));
        fd.append("assignedTeam", JSON.stringify(teamArr));

        files.forEach((f) => fd.append("attachments", f));
        body = fd;
      } else {
        // JSON body
        headers["Content-Type"] = "application/json";
        contentType = "application/json";

        const teamArr = form.teamInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ name }));

        body = JSON.stringify({
          projectTitle:         form.projectTitle.trim(),
          description:          form.description.trim(),
          owner:                form.owner.trim(),
          assignedTeam:         teamArr,
          status:               form.status,
          priority:             form.priority.toLowerCase(),
          startDate:            form.startDate || undefined,
          endDate:              form.endDate   || undefined,
          completionPercentage: Number(form.completionPercentage),
          riskLevel:            form.riskLevel.toLowerCase(),
        });
      }

      const res = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers,
        body,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? `Server error ${res.status}`);
      }

      setSuccess(true);
      setTimeout(() => {
        onCreated();
        onClose();
      }, 900);
    } catch (err: any) {
      setSubmitError(err.message ?? "Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] flex flex-col
            bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl
            border border-gray-200 dark:border-zinc-700 overflow-hidden"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Create New Project
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Fill in the details to start a new project
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* ── Body ── */}
          <form
            id="create-project-form"
            onSubmit={handleSubmit}
            className="overflow-y-auto flex-1 px-6 py-5 space-y-5"
          >
            {/* Success banner */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 text-sm"
              >
                <FiCheckCircle size={16} />
                Project created successfully!
              </motion.div>
            )}

            {/* Error banner */}
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm"
              >
                <FiAlertCircle size={16} />
                {submitError}
              </motion.div>
            )}

            {/* Row 1 — Project Name (full width) */}
            <Field label="Project Name *">
              <input
                name="projectTitle"
                type="text"
                placeholder="e.g. Platform Redesign Q2"
                value={form.projectTitle}
                onChange={handleChange}
                className={inputCls}
                required
              />
            </Field>

            {/* Row 2 — Description */}
            <Field label="Description">
              <textarea
                name="description"
                rows={3}
                placeholder="Briefly describe the project scope and goals…"
                value={form.description}
                onChange={handleChange}
                className={
                  inputCls.replace("h-10", "min-h-[80px]") + " pt-2 resize-none"
                }
              />
            </Field>

            {/* Row 3 — Owner | Assigned Team */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Owner">
                <input
                  name="owner"
                  type="text"
                  placeholder="e.g. John Smith"
                  value={form.owner}
                  onChange={handleChange}
                  className={inputCls}
                />
              </Field>
              <Field label="Assigned Team (comma-separated)">
                <input
                  name="teamInput"
                  type="text"
                  placeholder="Alice, Bob, Carol"
                  value={form.teamInput}
                  onChange={handleChange}
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Row 4 — Status | Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Status">
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={selectCls}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className={selectCls}
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Row 5 — Start Date | End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Start Date">
                <input
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                  className={inputCls}
                />
              </Field>
              <Field label="End Date">
                <input
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleChange}
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Row 6 — Completion % | Risk Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Completion (%)">
                <div className="space-y-1.5">
                  <input
                    name="completionPercentage"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={form.completionPercentage}
                    onChange={handleChange}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>0%</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs">
                      {form.completionPercentage}%
                    </span>
                    <span>100%</span>
                  </div>
                </div>
              </Field>
              <Field label="Risk Level">
                <select
                  name="riskLevel"
                  value={form.riskLevel}
                  onChange={handleChange}
                  className={selectCls}
                >
                  {RISK_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Row 7 — Attachments */}
            <Field label="Attachments">
              <div
                className="relative flex flex-col items-center justify-center gap-2
                  border-2 border-dashed border-gray-300 dark:border-zinc-700
                  rounded-xl p-5 text-center cursor-pointer
                  hover:border-blue-400 dark:hover:border-blue-600
                  hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition"
                onClick={() => fileRef.current?.click()}
              >
                <FiUpload className="text-gray-400 dark:text-gray-500" size={22} />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Click to browse or drag &amp; drop files
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  onChange={handleFiles}
                  className="hidden"
                />
              </div>

              {/* File list */}
              {files.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {files.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-xs
                        px-3 py-1.5 rounded-lg
                        bg-gray-50 dark:bg-zinc-800
                        border border-gray-200 dark:border-zinc-700"
                    >
                      <span className="truncate text-gray-700 dark:text-gray-300 max-w-[85%]">
                        {f.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-gray-400 hover:text-red-500 transition ml-2 shrink-0"
                      >
                        <FiX size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Field>
          </form>

          {/* ── Footer ── */}
          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-800/40">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-300
                border border-gray-200 dark:border-zinc-700
                hover:bg-gray-100 dark:hover:bg-zinc-700 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-project-form"
              disabled={submitting || success}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium
                rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm
                transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <FiLoader className="animate-spin" size={14} />
                  Creating…
                </>
              ) : success ? (
                <>
                  <FiCheckCircle size={14} />
                  Created!
                </>
              ) : (
                <>
                  <FiPlusCircle size={14} />
                  Create Project
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

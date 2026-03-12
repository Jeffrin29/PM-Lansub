"use client";

import { useState } from "react";

export default function CreateTaskModal({ onClose, onCreate }: any) {

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Backlog");
  const [user, setUser] = useState("");

  function handleSubmit() {

    if (!title) return;

    onCreate({
      id: Date.now().toString(),
      title,
      status,
      user: user || "User",
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 w-[400px]">

        <h2 className="text-xl font-semibold mb-6">
          Create Task
        </h2>

        {/* Title */}

        <div className="mb-4">

          <label className="text-sm text-gray-500">
            Title
          </label>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-200 dark:border-zinc-800 rounded bg-gray-100 dark:bg-black"
          />

        </div>

        {/* Status */}

        <div className="mb-4">

          <label className="text-sm text-gray-500">
            Status
          </label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-200 dark:border-zinc-800 rounded bg-gray-100 dark:bg-black"
          >

            <option>Backlog</option>
            <option>To Do</option>
            <option>In Progress</option>
            <option>Complete</option>

          </select>

        </div>

        {/* Assignee */}

        <div className="mb-6">

          <label className="text-sm text-gray-500">
            Assignee
          </label>

          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="John Doe"
            className="w-full mt-1 p-2 border border-gray-200 dark:border-zinc-800 rounded bg-gray-100 dark:bg-black"
          />

        </div>

        {/* Buttons */}

        <div className="flex justify-end gap-3">

          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 dark:border-zinc-800 rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded"
          >
            Create
          </button>

        </div>

      </div>

    </div>
  );
}
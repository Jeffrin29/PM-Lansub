"use client";

export default function TaskDrawer({ task, onClose }: any) {

  if (!task) return null;

  return (
    <div className="fixed top-0 right-0 w-[420px] h-full bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-xl p-6 z-50">

      {/* Header */}

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-xl font-semibold">
          Task Details
        </h2>

        <button
          onClick={onClose}
          className="text-gray-500 hover:text-red-500"
        >
          ✕
        </button>

      </div>

      {/* Task Title */}

      <div className="mb-6">

        <label className="text-sm text-gray-500">
          Title
        </label>

        <input
          defaultValue={task.title}
          className="w-full mt-1 p-2 border border-gray-200 dark:border-zinc-800 rounded bg-gray-100 dark:bg-black"
        />

      </div>

      {/* Description */}

      <div className="mb-6">

        <label className="text-sm text-gray-500">
          Description
        </label>

        <textarea
          placeholder="Add description..."
          className="w-full mt-1 p-2 border border-gray-200 dark:border-zinc-800 rounded bg-gray-100 dark:bg-black"
        />

      </div>

      {/* Status */}

      <div className="mb-6">

        <label className="text-sm text-gray-500">
          Status
        </label>

        <select className="w-full mt-1 p-2 border border-gray-200 dark:border-zinc-800 rounded bg-gray-100 dark:bg-black">

          <option>Backlog</option>
          <option>To Do</option>
          <option>In Progress</option>
          <option>Complete</option>

        </select>

      </div>

      {/* Priority */}

      <div className="mb-6">

        <label className="text-sm text-gray-500">
          Priority
        </label>

        <select className="w-full mt-1 p-2 border border-gray-200 dark:border-zinc-800 rounded bg-gray-100 dark:bg-black">

          <option>Low</option>
          <option>Medium</option>
          <option>High</option>

        </select>

      </div>

      {/* Deadline */}

      <div className="mb-6">

        <label className="text-sm text-gray-500">
          Deadline
        </label>

        <input
          type="date"
          className="w-full mt-1 p-2 border border-gray-200 dark:border-zinc-800 rounded bg-gray-100 dark:bg-black"
        />

      </div>

      {/* Subtasks */}

      <div>

        <label className="text-sm text-gray-500">
          Subtasks
        </label>

        <ul className="mt-2 space-y-2 text-sm">

          <li>☐ Setup API</li>
          <li>☐ Connect Database</li>
          <li>☐ Write tests</li>

        </ul>

      </div>

    </div>
  );
}
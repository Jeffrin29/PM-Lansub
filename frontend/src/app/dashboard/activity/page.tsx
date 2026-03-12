"use client";

import Avatar from "../../../components/dashboard/Avatar";

export default function ActivityPage() {

  return (

    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800">

      <h3 className="font-semibold mb-6">
        Activity Feed
      </h3>

      <div className="space-y-5">

        <div className="flex gap-3">

          <Avatar name="John" />

          <div>
            <p className="text-sm">
              John moved <b>Task 4</b> to In Progress
            </p>

            <p className="text-xs text-gray-400">
              5 minutes ago
            </p>
          </div>

        </div>

        <div className="flex gap-3">

          <Avatar name="Maria" />

          <div>
            <p className="text-sm">
              Maria completed <b>Database Setup</b>
            </p>

            <p className="text-xs text-gray-400">
              1 hour ago
            </p>
          </div>

        </div>

      </div>

    </div>

  );
}
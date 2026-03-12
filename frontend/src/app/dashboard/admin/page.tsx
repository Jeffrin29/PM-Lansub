"use client";

export default function AdminPage() {

  const users = [
    { id: 1, name: "John Doe", role: "Admin", status: "Active" },
    { id: 2, name: "Maria Smith", role: "Project Manager", status: "Active" },
    { id: 3, name: "Alex Lee", role: "Developer", status: "Inactive" },
    { id: 4, name: "Anna Brown", role: "Client Viewer", status: "Active" },
  ];

  const logs = [
    { id: 1, action: "User John Doe logged in", time: "5 min ago" },
    { id: 2, action: "Project ERP updated", time: "1 hour ago" },
    { id: 3, action: "Task assigned to Maria", time: "3 hours ago" },
    { id: 4, action: "Role updated for Alex", time: "Yesterday" },
  ];

  return (
    <div className="space-y-10">

      <h1 className="text-3xl font-semibold">
        Admin Panel
      </h1>


      {/* System Overview */}

      <div className="grid grid-cols-4 gap-6">

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-xl">
          <p className="text-sm text-gray-500">Total Users</p>
          <h2 className="text-3xl mt-2 font-semibold">24</h2>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-xl">
          <p className="text-sm text-gray-500">Active Projects</p>
          <h2 className="text-3xl mt-2 font-semibold">8</h2>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-xl">
          <p className="text-sm text-gray-500">Tasks Created</p>
          <h2 className="text-3xl mt-2 font-semibold">120</h2>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-xl">
          <p className="text-sm text-gray-500">System Alerts</p>
          <h2 className="text-3xl mt-2 text-red-500 font-semibold">3</h2>
        </div>

      </div>


      {/* User Management */}

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl">

        <div className="p-6 border-b border-gray-200 dark:border-zinc-800">

          <h2 className="text-xl font-semibold">
            User Management
          </h2>

        </div>

        <table className="w-full text-sm">

          <thead className="border-b border-gray-200 dark:border-zinc-800">

            <tr className="text-left">

              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>

            </tr>

          </thead>

          <tbody>

            {users.map((user) => (

              <tr
                key={user.id}
                className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800"
              >

                <td className="p-4 font-medium">
                  {user.name}
                </td>

                <td className="p-4">
                  {user.role}
                </td>

                <td className="p-4">

                  <span className={`text-xs px-2 py-1 rounded
                    ${user.status === "Active"
                      ? "bg-green-500 text-white"
                      : "bg-gray-400 text-white"}`}>

                    {user.status}

                  </span>

                </td>

                <td className="p-4">

                  <button className="text-blue-500 hover:underline mr-3">
                    Edit
                  </button>

                  <button className="text-red-500 hover:underline">
                    Remove
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>


      {/* Audit Logs */}

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl">

        <div className="p-6 border-b border-gray-200 dark:border-zinc-800">

          <h2 className="text-xl font-semibold">
            Audit Logs
          </h2>

        </div>

        <div className="p-6 space-y-4">

          {logs.map((log) => (

            <div
              key={log.id}
              className="flex justify-between text-sm"
            >

              <span>
                {log.action}
              </span>

              <span className="text-gray-500">
                {log.time}
              </span>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}
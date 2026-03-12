"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

const chartData = [
  { name: "Jan", value: 10 },
  { name: "Feb", value: 25 },
  { name: "Mar", value: 18 },
  { name: "Apr", value: 32 },
  { name: "May", value: 40 },
  { name: "Jun", value: 35 }
];

export default function Dashboard() {
  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-semibold">
          Dashboard
        </h1>

        <p className="text-gray-500 dark:text-gray-400">
          Overview of your projects and tasks
        </p>
      </div>


      {/* KPI CARDS */}

      <div className="grid grid-cols-4 gap-6">

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
          <p className="text-sm opacity-80">Active Projects</p>
          <h2 className="text-3xl font-semibold mt-2">5</h2>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
          <p className="text-sm opacity-80">Completed Tasks</p>
          <h2 className="text-3xl font-semibold mt-2">24</h2>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl">
          <p className="text-sm opacity-80">Pending Tasks</p>
          <h2 className="text-3xl font-semibold mt-2">12</h2>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl">
          <p className="text-sm opacity-80">Overdue Tasks</p>
          <h2 className="text-3xl font-semibold mt-2">2</h2>
        </div>

      </div>


      {/* ANALYTICS CHART */}

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6">

        <h3 className="font-semibold mb-4">
          Project Activity
        </h3>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
            />

          </LineChart>
        </ResponsiveContainer>

      </div>


      {/* PROJECT + TASK OVERVIEW */}

      <div className="grid grid-cols-2 gap-6">

        {/* PROJECTS */}

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6">

          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Projects Overview</h3>
            <button className="text-blue-500 text-sm">
              View All
            </button>
          </div>

          <div className="space-y-5">

            <div>
              <p className="text-sm">ERP Implementation</p>

              <div className="w-full bg-gray-200 dark:bg-zinc-800 h-2 rounded mt-2">
                <div className="bg-blue-500 h-2 rounded w-[40%]" />
              </div>

              <p className="text-xs text-gray-400 mt-1">
                40% completed
              </p>
            </div>

            <div>
              <p className="text-sm">Mobile App Launch</p>

              <div className="w-full bg-gray-200 dark:bg-zinc-800 h-2 rounded mt-2">
                <div className="bg-green-500 h-2 rounded w-[60%]" />
              </div>

              <p className="text-xs text-gray-400 mt-1">
                60% completed
              </p>
            </div>

            <div>
              <p className="text-sm">Website Redesign</p>

              <div className="w-full bg-gray-200 dark:bg-zinc-800 h-2 rounded mt-2">
                <div className="bg-yellow-500 h-2 rounded w-[20%]" />
              </div>

              <p className="text-xs text-gray-400 mt-1">
                20% completed
              </p>
            </div>

          </div>

        </div>


        {/* TASK SUMMARY */}

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6">

          <h3 className="font-semibold mb-4">
            Task Summary
          </h3>

          <div className="space-y-4 text-sm">

            <div className="flex justify-between">
              <span>To Do</span>
              <span className="text-blue-500">3</span>
            </div>

            <div className="flex justify-between">
              <span>In Progress</span>
              <span className="text-yellow-500">5</span>
            </div>

            <div className="flex justify-between">
              <span>Completed</span>
              <span className="text-green-500">10</span>
            </div>

            <div className="flex justify-between">
              <span>Overdue</span>
              <span className="text-red-500">2</span>
            </div>

          </div>

        </div>

      </div>


      {/* PROJECT TABLE */}

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6">

        <h3 className="font-semibold mb-4">
          Project Summary
        </h3>

        <table className="w-full text-sm">

          <thead className="text-gray-500">

            <tr>
              <th className="text-left py-2">Project</th>
              <th className="text-left py-2">Manager</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Progress</th>
            </tr>

          </thead>

          <tbody className="space-y-2">

            <tr>
              <td>ERP Portal</td>
              <td>John</td>
              <td className="text-green-500">Active</td>
              <td>40%</td>
            </tr>

            <tr>
              <td>Mobile App</td>
              <td>Maria</td>
              <td className="text-yellow-500">In Progress</td>
              <td>60%</td>
            </tr>

            <tr>
              <td>CRM System</td>
              <td>David</td>
              <td className="text-blue-500">Planning</td>
              <td>20%</td>
            </tr>

          </tbody>

        </table>

      </div>


      {/* TEAM WORKLOAD */}

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6">

        <h3 className="font-semibold mb-4">
          Team Workload
        </h3>

        <div className="space-y-4">

          <div className="flex justify-between">
            <span>John</span>
            <span className="text-yellow-500">
              3 tasks in progress
            </span>
          </div>

          <div className="flex justify-between">
            <span>Maria</span>
            <span className="text-blue-500">
              2 tasks assigned
            </span>
          </div>

          <div className="flex justify-between">
            <span>David</span>
            <span className="text-green-500">
              1 task completed
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
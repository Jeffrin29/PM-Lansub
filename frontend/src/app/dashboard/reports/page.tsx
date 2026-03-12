"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function ReportsPage() {

  const projectData = [
    { name: "ERP", progress: 70 },
    { name: "Mobile App", progress: 50 },
    { name: "Website", progress: 85 },
    { name: "CRM", progress: 40 },
  ];

  const taskTrend = [
    { day: "Mon", tasks: 5 },
    { day: "Tue", tasks: 8 },
    { day: "Wed", tasks: 6 },
    { day: "Thu", tasks: 10 },
    { day: "Fri", tasks: 7 },
  ];

  return (
    <div className="space-y-10">

      <h1 className="text-3xl font-semibold">
        Reports
      </h1>


      {/* KPI Cards */}

      <div className="grid grid-cols-4 gap-6">

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-xl">
          <p className="text-gray-500 text-sm">Total Projects</p>
          <h2 className="text-3xl mt-2 font-semibold">12</h2>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-xl">
          <p className="text-gray-500 text-sm">Completed Tasks</p>
          <h2 className="text-3xl mt-2 font-semibold">45</h2>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-xl">
          <p className="text-gray-500 text-sm">Pending Tasks</p>
          <h2 className="text-3xl mt-2 font-semibold">18</h2>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-xl">
          <p className="text-gray-500 text-sm">Overdue Tasks</p>
          <h2 className="text-3xl mt-2 text-red-500 font-semibold">4</h2>
        </div>

      </div>


      {/* Charts Section */}

      <div className="grid grid-cols-2 gap-6">

        {/* Project Progress */}

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-xl">

          <h3 className="font-semibold mb-4">
            Project Progress
          </h3>

          <ResponsiveContainer width="100%" height={250}>

            <BarChart data={projectData}>

              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />

              <Bar
                dataKey="progress"
                fill="#3b82f6"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>


        {/* Task Completion Trend */}

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-xl">

          <h3 className="font-semibold mb-4">
            Task Completion Trend
          </h3>

          <ResponsiveContainer width="100%" height={250}>

            <LineChart data={taskTrend}>

              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />

              <Line
                type="monotone"
                dataKey="tasks"
                stroke="#10b981"
                strokeWidth={3}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>
  );
}
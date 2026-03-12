"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const data = [
  { name: "John", tasks: 8 },
  { name: "Sara", tasks: 12 },
  { name: "Alex", tasks: 5 },
  { name: "Mike", tasks: 9 },
];

export default function TeamWorkload() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">

      <h2 className="text-xl font-semibold mb-4">Team Workload</h2>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="tasks" fill="#6366f1" radius={[6,6,0,0]} />
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}
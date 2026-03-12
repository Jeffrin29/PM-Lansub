"use client";

import { RadialBarChart, RadialBar, Legend, ResponsiveContainer } from "recharts";

const data = [
  {
    name: "Health",
    value: 72,
    fill: "#22c55e"
  }
];

export default function ProjectHealth() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg text-center">

      <h2 className="text-xl font-semibold mb-4">Project Health Score</h2>

      <ResponsiveContainer width="100%" height={250}>
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar dataKey="value" cornerRadius={10} fill="#22c55e" />
          <Legend />
        </RadialBarChart>
      </ResponsiveContainer>

      <p className="text-3xl font-bold text-green-600">72%</p>

    </div>
  );
}
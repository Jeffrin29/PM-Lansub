"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const data = [
  { name: "Mon", tasks: 12 },
  { name: "Tue", tasks: 18 },
  { name: "Wed", tasks: 10 },
  { name: "Thu", tasks: 22 },
  { name: "Fri", tasks: 16 },
  { name: "Sat", tasks: 25 },
  { name: "Sun", tasks: 20 },
];

export default function TaskAnalytics() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">

      <h2 className="text-xl font-semibold mb-4">Weekly Task Analytics</h2>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="tasks" stroke="#4f46e5" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>

    </div>
  );
}
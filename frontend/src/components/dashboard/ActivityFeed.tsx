export default function ActivityFeed() {

  const activities = [
    "John assigned task API Integration",
    "Maria completed UI design",
    "Finance report generated",
    "New project created"
  ]

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-xl">

      <h3 className="font-semibold mb-4">
        Recent Activity
      </h3>

      <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">

        {activities.map((a, i) => (
          <li key={i}>{a}</li>
        ))}

      </ul>

    </div>
  );
}
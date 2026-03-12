"use client";

export default function NotificationsPage() {

  const notifications = [
    {
      id: 1,
      type: "assignment",
      message: "John assigned you a task: API Integration",
      time: "5 min ago",
      priority: "high",
    },
    {
      id: 2,
      type: "deadline",
      message: "Deadline approaching for Mobile App UI",
      time: "1 hour ago",
      priority: "medium",
    },
    {
      id: 3,
      type: "completion",
      message: "Maria completed task: Database Setup",
      time: "3 hours ago",
      priority: "low",
    },
    {
      id: 4,
      type: "update",
      message: "Project CRM Dashboard updated",
      time: "Yesterday",
      priority: "low",
    },
  ];

  function getIcon(type: string) {
    switch (type) {
      case "assignment":
        return "📌";
      case "deadline":
        return "⏱";
      case "completion":
        return "✅";
      default:
        return "🔔";
    }
  }

  function getPriorityColor(priority: string) {
    if (priority === "high") return "bg-red-500 text-white";
    if (priority === "medium") return "bg-yellow-500 text-black";
    return "bg-green-500 text-white";
  }

  return (
    <div className="space-y-8">

      <h1 className="text-3xl font-semibold">
        Notifications
      </h1>


      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl">

        {notifications.map((n) => (

          <div
            key={n.id}
            className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
          >

            {/* Left */}

            <div className="flex items-center gap-4">

              <span className="text-xl">
                {getIcon(n.type)}
              </span>

              <div>

                <p className="font-medium">
                  {n.message}
                </p>

                <p className="text-sm text-gray-500">
                  {n.time}
                </p>

              </div>

            </div>


            {/* Priority */}

            <span
              className={`text-xs px-3 py-1 rounded ${getPriorityColor(n.priority)}`}
            >
              {n.priority.toUpperCase()}
            </span>

          </div>

        ))}

      </div>

    </div>
  );
}
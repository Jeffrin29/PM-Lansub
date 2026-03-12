export default function DashboardCard({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-xl">

      <p className="text-gray-500 dark:text-gray-400 text-sm">
        {title}
      </p>

      <h2 className="text-3xl font-semibold mt-2">
        {value}
      </h2>

    </div>
  );
}
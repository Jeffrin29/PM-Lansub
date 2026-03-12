export default function ProjectBoard() {

  const columns = ["Planning", "Active", "On Hold", "Completed"]

  return (
    <div className="grid grid-cols-4 gap-6">

      {columns.map((col) => (

        <div
          key={col}
          className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl"
        >

          <h3 className="font-semibold mb-4">
            {col}
          </h3>

          <div className="bg-gray-100 dark:bg-black border border-gray-200 dark:border-zinc-800 p-4 rounded-lg">

            <p className="font-medium">
              ERP Implementation
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Backend Integration
            </p>

          </div>

        </div>

      ))}

    </div>
  );
}
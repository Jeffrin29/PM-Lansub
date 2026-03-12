 export default function TimesheetsPage() {

return(           
            <div className="space-y-6">

            {/* Header */}

            <div className="flex justify-between items-center">

            <h1 className="text-2xl font-semibold">
            Timesheets
            </h1>

            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition">
            + Add Time Log
            </button>

            </div>


            {/* Timesheet Table */}

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">

            <table className="w-full text-sm">

            <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-500">

            <tr>

            <th className="text-left px-4 py-3">#</th>
            <th className="text-left px-4 py-3">Task</th>
            <th className="text-left px-4 py-3">Daily Log</th>
            <th className="text-left px-4 py-3">Approval</th>
            <th className="text-left px-4 py-3">User</th>
            <th className="text-left px-4 py-3">Billing</th>

            </tr>

            </thead>

            <tbody>

            <tr>

            <td colSpan={6} className="text-center py-16 text-gray-400">

            <div className="flex flex-col items-center gap-3">

            <p className="text-sm">
            No timesheets logged yet
            </p>

            <p className="text-xs text-gray-500">
            Click "Add Time Log" to start tracking work hours
            </p>

            </div>

            </td>

            </tr>

            </tbody>

            </table>

            </div>

            </div>

            )}
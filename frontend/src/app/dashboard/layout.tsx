import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";
import CommandPalette from "../../components/dashboard/CommandPalette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex bg-[#0b0f19] text-white overflow-hidden">

      {/* SIDEBAR */}

      <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-zinc-800">
        <Sidebar />
      </div>

      {/* MAIN */}

      <div className="flex flex-col flex-1">

        {/* TOPBAR */}

        <div className="h-16 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
          <Topbar />
        </div>

        {/* SCROLLABLE PAGE CONTENT */}

        <main className="flex-1 overflow-y-auto py-8">
          <div className="w-full max-w-7xl mx-auto px-6">
            {children}
          </div>
        </main>

      </div>

      {/* GLOBAL COMMAND PALETTE (Ctrl+K) */}
      <CommandPalette />
    </div>
  );
}
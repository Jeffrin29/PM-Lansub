"use client";

import { useState } from "react";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";
import CommandPalette from "../../components/dashboard/CommandPalette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen flex bg-[#f1f5f9] dark:bg-[#0b0f19] text-gray-900 dark:text-white overflow-hidden">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-50 flex-shrink-0
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* MAIN AREA */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* TOPBAR */}
        <div className="h-16 flex-shrink-0">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
        </div>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden py-6 md:py-8 bg-[#f1f5f9] dark:bg-[#0b0f19]">
          <div className="w-full max-w-full mx-auto px-4 sm:px-6 overflow-hidden">
            {children}
          </div>
        </main>

      </div>

      {/* COMMAND PALETTE */}
      <CommandPalette />
    </div>
  );
}
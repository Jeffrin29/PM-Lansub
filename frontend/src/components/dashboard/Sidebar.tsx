"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  FaChartPie,
  FaProjectDiagram,
  FaTasks,
  FaClock,
  FaStream,
  FaComments,
  FaFileAlt,
  FaBell,
  FaUserShield,
  FaUsers,
  FaRobot
} from "react-icons/fa";

import { FiLogOut } from "react-icons/fi";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", Icon: FaChartPie },
  { href: "/dashboard/overview", label: "Overview", Icon: FaStream },
  { href: "/dashboard/projects", label: "Projects", Icon: FaProjectDiagram },
  { href: "/dashboard/tasks", label: "Tasks", Icon: FaTasks },
  { href: "/dashboard/timesheets", label: "Timesheets", Icon: FaClock },
  { href: "/dashboard/activity", label: "Activity Feed", Icon: FaStream },
  { href: "/dashboard/employee", label: "My Dashboard", Icon: FaUsers },
  { href: "/dashboard/admin", label: "Admin", Icon: FaUserShield },
  { href: "/dashboard/hrms", label: "HRMS", Icon: FaUsers },
  { href: "/dashboard/discussions", label: "Discussions", Icon: FaComments },
  { href: "/dashboard/reports", label: "Reports", Icon: FaFileAlt },
  { href: "/dashboard/notif", label: "Notifications", Icon: FaBell },
  { href: "/dashboard/ai", label: "AI Assistant", Icon: FaRobot },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [role, setRole] = useState("admin"); // Fallback to admin for demo
  useEffect(() => {
    try {
      const authData = JSON.parse(localStorage.getItem("lansub-auth") || "{}");
      const r = (authData.user?.role || 'admin').toLowerCase();
      setRole(r);
    } catch (e) {
      setRole("admin");
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("lansub-auth");
    router.push("/auth");
  }

  return (
    <div className="w-64 h-screen flex flex-col bg-white dark:bg-black border-r border-gray-200 dark:border-zinc-800 text-black dark:text-white p-6">
      <h1 className="text-xl font-semibold mb-10">LANSUB</h1>

      <nav className="space-y-1.5 flex-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none"
                  : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              <item.Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>


      {/* Logout */}

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition"
      >

        <FiLogOut size={18} />
        Logout
      </button>

    </div>

  );
}
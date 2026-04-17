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

// roles that can see each nav item (undefined = all roles can see it)
const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", Icon: FaChartPie },
  { href: "/dashboard/overview", label: "Overview", Icon: FaStream },
  { href: "/dashboard/projects", label: "Projects", Icon: FaProjectDiagram },
  { href: "/dashboard/tasks", label: "Tasks", Icon: FaTasks },
  { href: "/dashboard/timesheets", label: "Timesheets", Icon: FaClock },
  { href: "/dashboard/activity", label: "Activity Feed", Icon: FaStream },
  { href: "/dashboard/employee", label: "My Dashboard", Icon: FaUsers },
  { href: "/dashboard/discussions", label: "Discussions", Icon: FaComments },
  { href: "/dashboard/notifications", label: "Notifications", Icon: FaBell },
  { href: "/dashboard/profile", label: "Profile", Icon: FaUserShield },
  // ── Restricted pages ───────────────────────────────────────────────────────
  {
    href: "/dashboard/reports",
    label: "Reports",
    Icon: FaFileAlt,
    allowedRoles: ["admin", "project_manager", "manager"],
  },
  {
    href: "/dashboard/hrms",
    label: "HRMS",
    Icon: FaUsers,
    allowedRoles: ["admin", "hr", "manager"],
  },
  {
    href: "/dashboard/admin",
    label: "Admin",
    Icon: FaUserShield,
    allowedRoles: ["admin"],
  },
  {
    href: "/dashboard/ai",
    label: "AI Assistant",
    Icon: FaRobot,
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [role, setRole] = useState<string>("employee");

  useEffect(() => {
    try {
      const userRaw = localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;
      
      let rawRole = 'employee';
      if (user?.roleId?.name) {
        rawRole = user.roleId.name;
      } else if (user?.role?.name) {
        rawRole = user.role.name;
      } else if (user?.role) {
        rawRole = typeof user.role === 'string' ? user.role : (user.role.name || 'employee');
      }

      const normalizedRole = rawRole.toLowerCase().trim().replace(/\s+/g, '_');
      console.log("[SIDEBAR] Normalized User Role:", normalizedRole);
      setRole(normalizedRole);
    } catch (err) {
      console.error("[SIDEBAR] Role detection error:", err);
      setRole("employee");
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth");
  }

  // Filter nav items based on the current user's role
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.allowedRoles) return true;               // no restriction → visible to all
    return item.allowedRoles.includes(role);           // role must be in allowedRoles
  });

  return (
    <div className="w-64 h-screen flex flex-col bg-white dark:bg-black border-r border-gray-200 dark:border-zinc-800 text-black dark:text-white p-6">
      <h1 className="text-xl font-semibold mb-10">LANSUB</h1>

      <nav className="space-y-1.5 flex-1 overflow-y-auto scrollbar-hide">
        {visibleItems.map((item) => {
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

      {/* Role badge */}
      <div className="mb-4 px-4 py-1.5 text-xs font-semibold rounded-full self-start capitalize
        bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
        {role}
      </div>

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
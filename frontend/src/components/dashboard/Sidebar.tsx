"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

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
  FaRobot,
  FaTimes,
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
  { href: "/dashboard/discussions", label: "Discussions", Icon: FaComments },
  { href: "/dashboard/notifications", label: "Notifications", Icon: FaBell },
  { href: "/dashboard/profile", label: "Profile", Icon: FaUserShield },
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

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string>("employee");

  useEffect(() => {
    try {
      const userRaw = localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;

      let rawRole = "employee";
      if (user?.roleId?.name) {
        rawRole = user.roleId.name;
      } else if (user?.role?.name) {
        rawRole = user.role.name;
      } else if (user?.role) {
        rawRole = typeof user.role === "string" ? user.role : (user.role.name || "employee");
      }

      const normalizedRole = rawRole.toLowerCase().trim().replace(/\s+/g, "_");
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

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(role);
  });

  return (
    /*
     * Light mode:  dark navy (#0f172a) — creates strong contrast against white content
     * Dark mode:   pitch black (#000)  — unchanged from original
     */
    <div className="w-64 h-screen flex flex-col bg-[#0f172a] dark:bg-black border-r border-white/10 dark:border-zinc-800 text-white p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="LANSUB Logo"
            width={32}
            height={32}
            className="object-contain"
          />
          <h1 className="text-xl font-bold tracking-tight text-white">
            LANSUB
          </h1>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close sidebar"
          >
            <FaTimes size={14} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="space-y-1 flex-1 overflow-y-auto scrollbar-hide">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50 dark:shadow-none"
                : "text-slate-400 dark:text-zinc-400 hover:bg-white/10 dark:hover:bg-zinc-900 hover:text-white"
                }`}
            >
              <item.Icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Role badge */}
      <div className="mb-4 px-4 py-1.5 text-xs font-semibold rounded-full self-start capitalize bg-white/10 dark:bg-blue-900/30 text-slate-300 dark:text-blue-400 border border-white/20 dark:border-blue-800">
        {role}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 text-slate-400 dark:text-gray-400 hover:text-white dark:hover:text-white transition-colors text-sm font-medium min-h-[44px]"
      >
        <FiLogOut size={16} />
        Logout
      </button>
    </div>
  );
}
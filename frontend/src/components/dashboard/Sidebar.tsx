"use client";

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
  FaRobot,
  FaCheckDouble,
  FaVideo,
} from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";

import { useCurrentUser } from "../../hooks/useCurrentUser";
import { normaliseRole, type AppRole } from "../../utils/roleAccess";

// ── Nav item definition ──────────────────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Roles that may see this item. Undefined = everyone. */
  roles?: AppRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",                  label: "Dashboard",          icon: <FaChartPie size={16} /> },
  { href: "/dashboard/overview",          label: "Overview",           icon: <FaStream size={16} /> },
  { href: "/dashboard/projects",          label: "Projects",           icon: <FaProjectDiagram size={16} /> },
  { href: "/dashboard/tasks",             label: "Tasks",              icon: <FaTasks size={16} /> },
  { href: "/dashboard/timesheets",        label: "Timesheets",         icon: <FaClock size={16} /> },
  { href: "/dashboard/activity",          label: "Activity Feed",      icon: <FaStream size={16} /> },
  { href: "/dashboard/employee",          label: "My Dashboard",       icon: <FaUsers size={16} /> },
  { href: "/dashboard/discussions",       label: "Discussions",        icon: <FaComments size={16} /> },
  { href: "/dashboard/notif",             label: "Notifications",      icon: <FaBell size={16} /> },
  { href: "/dashboard/meetings",           label: "Meetings",           icon: <FaVideo size={16} /> },
  { href: "/dashboard/ai",               label: "AI Assistant",       icon: <FaRobot size={16} /> },
  // ── Privileged routes ──────────────────────────────────────────────────────
  {
    href: "/dashboard/admin/timesheets",
    label: "Timesheet Approval",
    icon: <FaCheckDouble size={16} />,
    roles: ["admin", "project_manager"],
  },
  {
    href: "/dashboard/admin",
    label: "Admin",
    icon: <FaUserShield size={16} />,
    roles: ["admin"],
  },
  {
    href: "/dashboard/hrms",
    label: "HRMS",
    icon: <FaUsers size={16} />,
    roles: ["admin", "hr"],
  },
  {
    href: "/dashboard/reports",
    label: "Reports",
    icon: <FaFileAlt size={16} />,
    roles: ["admin", "hr"],
  },
];

export default function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { role: hookRole, loading } = useCurrentUser();

  // Instant Check: Read role from localStorage
  const getStoredRole = () => {
    if (typeof window === 'undefined') return 'employee';
    try {
      const raw = localStorage.getItem('lansub-auth');
      if (!raw) return 'employee';
      const parsed = JSON.parse(raw);
      return parsed.role || 'employee';
    } catch { return 'employee'; }
  };

  const storedRole = getStoredRole();
  const normRole = normaliseRole(hookRole !== 'employee' ? hookRole : (storedRole || 'employee'));

  function handleLogout() {
    localStorage.removeItem("lansub-auth");
    router.push("/auth");
  }

  // Filter nav items by role
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(normRole);
  });

  const linkBase =
    "flex items-center gap-3 text-sm font-medium transition rounded-lg px-3 py-2";
  const linkActive =
    "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400";
  const linkInactive =
    "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/60";

  return (
    <div className="w-64 h-screen flex flex-col bg-white dark:bg-black border-r border-gray-200 dark:border-zinc-800 text-black dark:text-white p-4">
      {/* Logo */}
      <h1 className="text-xl font-semibold mb-8 px-3">LANSUB</h1>

      {/* Role badge (subtle) */}
      {!loading && (
        <div className="mb-4 px-3">
          <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-zinc-500">
            {normRole.replace("_", " ")}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${linkBase} ${isActive ? linkActive : linkInactive}`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="mt-4 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition text-sm font-medium"
      >
        <FiLogOut size={18} />
        Logout
      </button>
    </div>
  );
}
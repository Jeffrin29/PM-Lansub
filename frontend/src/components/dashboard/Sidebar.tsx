"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function Sidebar() {

  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("lansub-auth");
    router.push("/auth");
  }

  const itemStyle =
    "flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition";

  return (

    <div className="w-64 h-screen flex flex-col bg-white dark:bg-black border-r border-gray-200 dark:border-zinc-800 text-black dark:text-white p-6">

      {/* Logo */}

      <h1 className="text-xl font-semibold mb-10">
        LANSUB
      </h1>


      {/* Navigation */}

      <nav className="space-y-6 flex-1">

        <Link href="/dashboard" className={itemStyle}>
          <FaChartPie size={16} />
          Dashboard
        </Link>

        <Link href="/dashboard/overview" className={itemStyle}>
          <FaStream size={16} />
          Overview
        </Link>

        <Link href="/dashboard/projects" className={itemStyle}>
          <FaProjectDiagram size={16} />
          Projects
        </Link>

        <Link href="/dashboard/tasks" className={itemStyle}>
          <FaTasks size={16} />
          Tasks
        </Link>

        <Link href="/dashboard/timesheets" className={itemStyle}>
          <FaClock size={16} />
          Timesheets
        </Link>

        <Link href="/dashboard/activity" className={itemStyle}>
          <FaStream size={16} />
          Activity Feed
        </Link>

        <Link href="/dashboard/employee" className={itemStyle}>
          <FaUsers size={16} />
          My Dashboard
        </Link>

        <Link href="/dashboard/admin" className={itemStyle}>
          <FaUserShield size={16} />
          Admin
        </Link>

        <Link href="/dashboard/hrms" className={itemStyle}>
          <FaUsers size={16} />
          HRMS
        </Link>

        <Link href="/dashboard/discussions" className={itemStyle}>
          <FaComments size={16} />
          Discussions
        </Link>

        <Link href="/dashboard/reports" className={itemStyle}>
          <FaFileAlt size={16} />
          Reports
        </Link>

        <Link href="/dashboard/notif" className={itemStyle}>
          <FaBell size={16} />
          Notifications
        </Link>

        <Link href="/dashboard/ai" className={itemStyle}>
          <FaRobot size={16} />
          AI Assistant
        </Link>

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
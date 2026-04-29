"use client";
import { FaSearch, FaBell, FaUserCircle, FaBars } from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { attendanceApi } from "../../lib/api";

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserName(user.name || "User");
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await attendanceApi.getHistory();
      const records = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setAttendance(records);
    } catch (err) {
      console.error("Failed to fetch attendance in topbar", err);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
    window.addEventListener("attendanceUpdated", fetchAttendance);
    return () => window.removeEventListener("attendanceUpdated", fetchAttendance);
  }, [fetchAttendance]);

  const todayRecord = attendance.find((a) => {
    const d = new Date(a.date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const isCheckedIn = !!todayRecord && !!todayRecord.checkIn;
  const isCheckedOut = !!todayRecord?.checkOut;

  const handleClockIn = async () => {
    setLoading(true);
    try {
      await attendanceApi.checkIn();
      fetchAttendance();
      window.dispatchEvent(new Event("attendanceUpdated"));
    } catch (err: any) {
      alert(err.message || "Clock-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      await attendanceApi.checkOut();
      fetchAttendance();
      window.dispatchEvent(new Event("attendanceUpdated"));
    } catch (err: any) {
      alert(err.message || "Clock-out failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    /*
     * Light mode:  dark navy (#0f172a) — matches sidebar for unified dark chrome
     * Dark mode:   black — unchanged from original
     */
    <div className="flex items-center justify-between h-16 bg-[#0f172a] dark:bg-black px-4 sm:px-6 gap-3 border-b border-white/10 dark:border-zinc-800">

      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Open sidebar"
      >
        <FaBars size={16} />
      </button>

      {/* Search bar */}
      <div className="flex items-center bg-white/10 dark:bg-zinc-900 border border-white/20 dark:border-zinc-700 rounded-xl px-4 py-2 w-full max-w-xs sm:max-w-sm transition-all focus-within:border-blue-400/60 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-400/20 dark:focus-within:ring-blue-500/10">
        <FaSearch className="text-slate-400 dark:text-gray-500 mr-2 flex-shrink-0" size={13} />
        <input
          placeholder="Search..."
          className="bg-transparent outline-none text-sm w-full text-white dark:text-gray-200 placeholder-slate-500 dark:placeholder-gray-600"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 ml-auto">

        {/* Attendance status widget */}
        <div className="hidden sm:flex items-center gap-3 bg-white/10 dark:bg-zinc-900/50 px-3 py-2 rounded-xl border border-white/15 dark:border-zinc-800">
          {todayRecord ? (
            <div className="flex gap-3 items-center">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  todayRecord.checkOut
                    ? "bg-blue-400"
                    : "bg-emerald-400 animate-pulse"
                }`}
              />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-500 tracking-wider leading-none">
                  {todayRecord.checkOut ? "Status: Done" : "Status: In"}
                </p>
                <p className="text-xs font-bold text-white dark:text-zinc-100">
                  {new Date(todayRecord.checkIn).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {todayRecord.checkOut && (
                <div className="pl-3 border-l border-white/20 dark:border-zinc-800">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none">
                    Out
                  </p>
                  <p className="text-xs font-bold text-white dark:text-zinc-100">
                    {new Date(todayRecord.checkOut).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider leading-none">
                Status
              </p>
              <p className="text-xs font-bold text-slate-400">Offline</p>
            </div>
          )}

          <div className="pl-3 ml-1 border-l border-white/15 dark:border-zinc-800">
            {isCheckedOut ? (
              <button
                disabled
                className="px-3 py-1.5 bg-white/10 dark:bg-zinc-800 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed"
              >
                Done
              </button>
            ) : isCheckedIn ? (
              <button
                id="clock-out-btn"
                disabled={loading}
                onClick={handleClockOut}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition min-h-[32px] min-w-[72px]"
              >
                {loading ? "..." : "Clock Out"}
              </button>
            ) : (
              <button
                id="clock-in-btn"
                disabled={loading}
                onClick={handleClockIn}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition min-h-[32px] min-w-[72px]"
              >
                {loading ? "..." : "Clock In"}
              </button>
            )}
          </div>
        </div>

        {/* Theme toggle */}
        <div className="text-slate-300 dark:text-gray-400">
          <ThemeToggle />
        </div>

        {/* Bell */}
        <div
          className="relative cursor-pointer p-2 rounded-lg hover:bg-white/10 dark:hover:bg-zinc-900 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
          onClick={() => router.push("/dashboard/notifications")}
        >
          <FaBell className="text-slate-300 dark:text-gray-500 hover:text-white dark:hover:text-white transition-colors" size={16} />
          <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f172a] dark:border-black" />
        </div>

        {/* Profile */}
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-white/10 dark:hover:bg-zinc-900 px-2.5 py-2 rounded-lg transition min-h-[44px]"
          onClick={() => router.push("/dashboard/profile")}
        >
          <span className="hidden sm:block text-sm font-semibold text-slate-200 dark:text-gray-200 truncate max-w-[100px]">
            {userName}
          </span>
          <FaUserCircle className="text-xl text-slate-400 dark:text-gray-400 flex-shrink-0" />
        </div>

      </div>
    </div>
  );
}
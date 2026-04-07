"use client";
import { FaSearch, FaBell, FaUserCircle } from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";
import { useState, useEffect, useCallback } from "react";
import { attendanceApi } from "../../lib/api";

export default function Topbar() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await attendanceApi.getHistory();
      const records = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
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

  const todayRecord = attendance.find(a => {
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
    } finally { setLoading(false); }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      await attendanceApi.checkOut();
      fetchAttendance();
      window.dispatchEvent(new Event("attendanceUpdated"));
    } catch (err: any) {
      alert(err.message || "Clock-out failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-black p-6">
      {/* Search */}
      <div className="flex items-center bg-zinc-900 dark:bg-zinc-900 light:bg-gray-200 border border-zinc-800 rounded-lg px-4 py-2 w-80">
        <FaSearch className="text-gray-400 mr-2" />
        <input
          placeholder="Search..."
          className="bg-transparent outline-none text-sm w-full"
        />
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-6">
        {/* Attendance Status UI */}
        <div className="flex items-center gap-3 bg-gray-50/50 dark:bg-zinc-900/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-zinc-800">
          {todayRecord ? (
            <div className="flex gap-3 items-center">
              <div className={`w-2 h-2 rounded-full ${todayRecord.checkOut ? 'bg-blue-500' : 'bg-emerald-500 animate-pulse'}`} />
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider leading-none">
                  {todayRecord.checkOut ? 'Status: Done' : 'Status: In'}
                </p>
                <p className="text-xs font-bold text-gray-900 dark:text-zinc-100">
                  {new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {todayRecord.checkOut && (
                <div className="pl-3 border-l border-gray-200 dark:border-zinc-800">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider leading-none">Out</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-zinc-100">
                    {new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider leading-none">Status</p>
              <p className="text-xs font-bold text-gray-400">Offline</p>
            </div>
          )}

          <div className="pl-3 ml-3 border-l border-gray-200 dark:border-zinc-800">
            {isCheckedOut ? (
              <button disabled className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-400 rounded-lg text-xs font-bold cursor-not-allowed">
                Done
              </button>
            ) : isCheckedIn ? (
              <button disabled={loading} onClick={handleClockOut} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition">
                {loading ? '...' : 'Clock Out'}
              </button>
            ) : (
              <button disabled={loading} onClick={handleClockIn} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-md shadow-emerald-200 dark:shadow-none">
                {loading ? '...' : 'Clock In'}
              </button>
            )}
          </div>
        </div>

        <ThemeToggle />
        <FaBell className="cursor-pointer" />
        <FaUserCircle className="text-xl cursor-pointer" />
      </div>
    </div>
  );
}
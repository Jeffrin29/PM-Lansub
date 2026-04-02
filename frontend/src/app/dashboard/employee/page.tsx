'use client';

import { useState, useEffect, useCallback } from 'react';
import { employeeApi } from "../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Attendance {
    _id: string;
    date: string;
    checkIn: string;
    checkOut: string;
    status: 'present' | 'absent' | 'half-day' | 'late';
}

interface Leave {
    _id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    approvalStatus: 'Pending' | 'Approved' | 'Rejected';
}

interface EmployeeStats {
    totalLeavesThisMonth: number;
    pendingLeaves: number;
    attendanceThisWeekPct: number;
    presentDays: number;
}

// ── Badge Component ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const m: Record<string, string> = {
        active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        Rejected: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    };
    return (
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${m[status] || 'bg-gray-100 text-gray-500'}`}>
            {status}
        </span>
    );
}

// ── Bar Chart Component (Simplified) ──────────────────────────────────────────
function SimpleBarChart({ data }: { data: any[] }) {
    return (
        <div className="flex items-end justify-between h-40 gap-2 overflow-x-auto pb-2">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 min-w-[40px] group">
                    <div className="w-full bg-blue-100 dark:bg-zinc-800 rounded-t-lg relative h-full">
                        <div
                            style={{ height: `${d.percentage}%` }}
                            className="bg-blue-600 rounded-t-lg absolute bottom-0 w-full transition-all group-hover:bg-blue-500"
                        />
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition whitespace-nowrap bg-black text-white p-1 rounded">
                            {d.percentage}%
                        </div>
                    </div>
                    <span className="text-[10px] mt-2 text-gray-400 uppercase font-medium">{d.month.split('-').pop()}</span>
                </div>
            ))}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmployeePage() {
    const [activeTab, setActiveTab] = useState<'attendance' | 'apply' | 'history'>('attendance');
    const [stats, setStats] = useState<EmployeeStats | null>(null);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        // Fetch each endpoint independently so one failure (e.g. missing HrEmployee record)
        // does not block the others from rendering.
        const settle = async (promise: Promise<any>) => {
            try { return await promise; } catch { return null; }
        };
        try {
            const [s, a, l, c] = await Promise.all([
                settle(employeeApi.getStats()),
                settle(employeeApi.getAttendance()),
                settle(employeeApi.getLeaves()),
                settle(employeeApi.getMonthlyChart()),
            ]);
            if (s)  setStats(s?.data?.data || null);
            if (a)  setAttendance(a?.data?.data ?? []);
            if (l)  setLeaves(l?.data?.data ?? []);
            if (c)  setChartData(c?.data?.data ?? []);
        } catch (err) {
            console.error('Failed to fetch employee data', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Check-in / check-out are handled by the navbar clock-in system.
    // These handler stubs are kept so the apply-leave form still has actionLoading.

    const handleApplyLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const body = Object.fromEntries(formData);
        setActionLoading(true);
        try {
            await employeeApi.applyLeave(body);
            alert('Leave applied successfully');
            fetchData();
            setActiveTab('history');
        } catch (err: any) { alert(err.message); }
        finally { setActionLoading(false); }
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employee Dashboard</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Self-service portal for attendance and leaves</p>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-6">
                <div className="col-span-3 grid grid-cols-2 gap-4">
                    {[
                        { label: 'Leaves (Month)', value: stats?.totalLeavesThisMonth ?? '—', color: 'text-violet-600' },
                        { label: 'Pending Requests', value: stats?.pendingLeaves ?? '—', color: 'text-amber-600' },
                        { label: 'Attendance (Week)', value: `${stats?.attendanceThisWeekPct ?? '—'}%`, color: 'text-blue-600' },
                        { label: 'Present Days', value: stats?.presentDays ?? '—', color: 'text-emerald-600' },
                    ].map((s) => (
                        <div key={s.label} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{s.label}</p>
                            <p className={`text-4xl font-black mt-2 ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                <div className="col-span-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900 dark:text-white">Attendance %</h3>
                        <span className="text-xs font-semibold px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">Last 6 Months</span>
                    </div>
                    <SimpleBarChart data={chartData} />
                </div>
            </div>

            <div className="flex gap-2 border-b border-gray-100 dark:border-zinc-800">
                {(['attendance', 'apply', 'history'] as const).map((t) => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-3 text-sm font-medium border-b-2 transition -mb-px ${activeTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        {t === 'attendance' ? 'My Attendance' : t === 'apply' ? 'Apply Leave' : 'Leave History'}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {activeTab === 'attendance' && (
                    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-zinc-800/50">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Date</th>
                                    <th className="px-5 py-4 font-semibold">Check In</th>
                                    <th className="px-5 py-4 font-semibold">Check Out</th>
                                    <th className="px-5 py-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                                {loading ? <tr><td colSpan={4} className="text-center py-10">Loading...</td></tr> : attendance?.length === 0 ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">No records found</td></tr> : attendance.map((a) => (
                                    <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40">
                                        <td className="px-5 py-4 font-medium">{a.date}</td>
                                        <td className="px-5 py-4">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '—'}</td>
                                        <td className="px-5 py-4">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '—'}</td>
                                        <td className="px-5 py-4"><StatusBadge status={a.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'apply' && (
                    <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
                        <h3 className="text-xl font-bold mb-6">Request Time Off</h3>
                        <form onSubmit={handleApplyLeave} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Leave Type</label>
                                    <select name="leaveType" required className="w-full p-2.5 rounded-xl border dark:bg-zinc-800 bg-white focus:ring-2 focus:ring-blue-500">
                                        <option>Annual Leave</option>
                                        <option>Sick Leave</option>
                                        <option>Casual Leave</option>
                                        <option>Unpaid Leave</option>
                                    </select>
                                </div>
                                <div></div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Start Date</label>
                                    <input name="startDate" type="date" required className="w-full p-2.5 rounded-xl border dark:bg-zinc-800 bg-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">End Date</label>
                                    <input name="endDate" type="date" required className="w-full p-2.5 rounded-xl border dark:bg-zinc-800 bg-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Reason</label>
                                <textarea name="reason" rows={3} placeholder="Please provide details..." className="w-full p-2.5 rounded-xl border dark:bg-zinc-800 bg-white focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <button disabled={actionLoading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition disabled:opacity-50">
                                {actionLoading ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-zinc-800/50">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Type</th>
                                    <th className="px-5 py-4 font-semibold">Start</th>
                                    <th className="px-5 py-4 font-semibold">End</th>
                                    <th className="px-5 py-4 font-semibold">Reason</th>
                                    <th className="px-5 py-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                                {loading ? <tr><td colSpan={5} className="text-center py-10">Loading...</td></tr> : leaves?.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">No records found</td></tr> : leaves.map((l) => (
                                    <tr key={l._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40">
                                        <td className="px-5 py-4 font-medium">{l.leaveType}</td>
                                        <td className="px-5 py-4">{new Date(l.startDate).toLocaleDateString()}</td>
                                        <td className="px-5 py-4">{new Date(l.endDate).toLocaleDateString()}</td>
                                        <td className="px-5 py-4 text-xs text-gray-500 truncate max-w-[200px]">{l.reason}</td>
                                        <td className="px-5 py-4"><StatusBadge status={l.approvalStatus} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

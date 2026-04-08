'use client';

import { useState, useEffect, useCallback } from 'react';
import { hrmsApi } from "../../../lib/api";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Employee {
    _id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    status: 'active' | 'inactive';
}

interface Department {
    _id: string;
    name: string;
    description: string;
}

interface Attendance {
    _id: string;
    employeeId: { name: string; email: string; department: string };
    date: string;
    checkIn: string;
    checkOut: string;
    status: 'present' | 'absent' | 'half-day' | 'late';
}

interface Leave {
    _id: string;
    employeeId: { name: string; email: string; department: string };
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
}

interface HrmsStats {
    totalEmployees: number;
    activeEmployees: number;
    departmentsCount: number;
    pendingLeaves: number;
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function Badge({ status, type = 'status' }: { status: string; type?: 'status' | 'leave' | 'attendance' }) {
    const mapping: Record<string, string> = {
        active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        inactive: 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400',
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        rejected: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        absent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        late: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };

    return (
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${mapping[status?.toLowerCase()] || mapping.inactive}`}>
            {status}
        </span>
    );
}

// ── Modals ────────────────────────────────────────────────────────────────────
function EmployeeModal({ onClose, onSave, employee }: { onClose: () => void; onSave: (d: any) => Promise<void>; employee?: Employee }) {
    const [form, setForm] = useState<any>(employee || { name: '', email: '', password: '', role: 'Employee', department: '', status: 'active' });
    const [saving, setSaving] = useState(false);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{employee ? 'Edit' : 'Add'} Employee</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <form className="p-6 space-y-4" onSubmit={async (e) => { e.preventDefault(); setSaving(true); await onSave(form); onClose(); }}>
                    <input placeholder="Name" className="w-full p-2.5 rounded-xl border dark:bg-zinc-800 bg-white" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    <input placeholder="Email" type="email" className="w-full p-2.5 rounded-xl border dark:bg-zinc-800 bg-white" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    {!employee && (
                         <input placeholder="Password" type="password" className="w-full p-2.5 rounded-xl border dark:bg-zinc-800 bg-white" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    )}
                    <select className="w-full p-2.5 rounded-xl border dark:bg-zinc-800 bg-white" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                        <option value="Employee">Employee</option>
                        <option value="HR">HR</option>
                        <option value="admin">Admin</option>
                        <option value="Manager">Manager</option>
                    </select>
                    <input placeholder="Department" className="w-full p-2.5 rounded-xl border dark:bg-zinc-800 bg-white" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                    <select className="w-full p-2.5 rounded-xl border dark:bg-zinc-800 bg-white" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HRMSPage() {
    const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'leave' | 'departments'>('employees');
    const [stats, setStats] = useState<HrmsStats | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const s = await hrmsApi.stats();
            setStats(s.data);
            if (activeTab === 'employees') {
                const res = await hrmsApi.getEmployees(search ? `&search=${search}` : '');
                setData(Array.isArray(res.data) ? res.data : []);
            } else if (activeTab === 'departments') {
                const res = await hrmsApi.getDepartments();
                setData(Array.isArray(res.data) ? res.data : []);
            } else if (activeTab === 'attendance') {
                const res = await hrmsApi.getAttendance();
                setData(Array.isArray(res.data) ? res.data : []);
            } else if (activeTab === 'leave') {
                const res = await hrmsApi.getLeaves();
                setData(Array.isArray(res.data) ? res.data : []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, search]);

    const router = useRouter();

    useEffect(() => {
        const authData = JSON.parse(localStorage.getItem("lansub-auth") || "{}");
        const roleStr = (typeof authData.user?.role === 'string' ? authData.user.role : authData.user?.role?.name || '').toLowerCase();
        if (!["admin", "hr", "manager"].includes(roleStr)) {
            router.push("/dashboard");
        }
    }, [router]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleLeaveAction = async (id: string, status: string) => {
        if (status === 'approved') {
            await hrmsApi.approveLeave(id);
        } else {
            await hrmsApi.rejectLeave(id);
        }
        fetchData();
    };

    return (
        <div className="space-y-8 pb-8">
            {showModal && <EmployeeModal onClose={() => { setShowModal(false); setEditing(null); }} onSave={async (d) => { editing ? await hrmsApi.updateEmployee(editing._id, d) : await hrmsApi.createEmployee(d); fetchData(); }} employee={editing} />}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">HRMS</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage organization workforce and operations</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md transition">＋ Add Employee</button>
            </div>

            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total Employees', value: stats?.totalEmployees ?? '—', color: 'text-violet-600' },
                    { label: 'Active', value: stats?.activeEmployees ?? '—', color: 'text-emerald-600' },
                    { label: 'Departments', value: stats?.departmentsCount ?? '—', color: 'text-blue-600' },
                    { label: 'Pending Leaves', value: stats?.pendingLeaves ?? '—', color: 'text-red-500' },
                ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">{s.label}</p>
                        <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 border-b border-gray-100 dark:border-zinc-800">
                {(['employees', 'attendance', 'leave', 'departments'] as const).map((t) => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-3 text-sm font-medium border-b-2 transition -mb-px ${activeTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {activeTab === 'employees' && (
                    <>
                        <input type="text" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-sm px-4 py-2 rounded-xl border dark:bg-zinc-900" />
                        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-zinc-800/50 text-left">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold">Name</th>
                                        <th className="px-5 py-4 font-semibold">Email</th>
                                        <th className="px-5 py-4 font-semibold">Department</th>
                                        <th className="px-5 py-4 font-semibold">Role</th>
                                        <th className="px-5 py-4 font-semibold">Status</th>
                                        <th className="px-5 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                                    {loading ? (
                                        <tr><td colSpan={6} className="text-center py-10">Loading...</td></tr>
                                    ) : data.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-10 text-gray-500 italic">No employees found. Add employee to get started.</td></tr>
                                    ) : data.map((emp) => (
                                        <tr key={emp._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40">
                                            <td className="px-5 py-4 font-medium">{emp.name}</td>
                                            <td className="px-5 py-4 text-gray-500">{emp.email}</td>
                                            <td className="px-5 py-4">{emp.department || '—'}</td>
                                            <td className="px-5 py-4">{emp.role}</td>
                                            <td className="px-5 py-4"><Badge status={emp.status} /></td>
                                            <td className="px-5 py-4 text-right">
                                                <button onClick={() => { setEditing(emp); setShowModal(true); }} className="text-blue-600 hover:underline mr-3">Edit</button>
                                                <button onClick={async () => { if (confirm('Delete?')) { await hrmsApi.deleteEmployee(emp._id); fetchData(); } }} className="text-red-500 hover:underline">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'attendance' && (
                    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-zinc-800/50">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Employee</th>
                                    <th className="px-5 py-4 font-semibold">Date</th>
                                    <th className="px-5 py-4 font-semibold">Check In</th>
                                    <th className="px-5 py-4 font-semibold">Check Out</th>
                                    <th className="px-5 py-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                                    {data.map((a: any) => (
                                        <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40">
                                            <td className="px-5 py-4">
                                                <p className="font-medium">{a.user?.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-400">{a.user?.email || '—'}</p>
                                            </td>
                                            <td className="px-5 py-4">{a.date}</td>
                                            <td className="px-5 py-4">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '—'}</td>
                                            <td className="px-5 py-4">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '—'}</td>
                                        <td className="px-5 py-4"><Badge status={a.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'leave' && (
                    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-zinc-800/50">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Employee</th>
                                    <th className="px-5 py-4 font-semibold">Leave Type</th>
                                    <th className="px-5 py-4 font-semibold">Dates</th>
                                    <th className="px-5 py-4 font-semibold">Status</th>
                                    <th className="px-5 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                                {data.map((l: any) => (
                                    <tr key={l._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40">
                                        <td className="px-5 py-4 font-medium">{l.user?.name || 'Unknown'}</td>
                                        <td className="px-5 py-4">{l.leaveType}</td>
                                        <td className="px-5 py-4 text-xs">{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</td>
                                        <td className="px-5 py-4"><Badge status={l.status} /></td>
                                        <td className="px-5 py-4 text-right">
                                            {l.status?.toLowerCase() === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleLeaveAction(l._id, 'approved')} className="text-emerald-600 hover:underline">Approve</button>
                                                    <button onClick={() => handleLeaveAction(l._id, 'rejected')} className="text-red-500 hover:underline">Reject</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'departments' && (
                    <div className="grid grid-cols-3 gap-4">
                        {data.map((dept: Department) => (
                            <div key={dept._id} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                                <h3 className="font-bold text-lg">{dept.name}</h3>
                                <p className="text-sm text-gray-400 mt-1">{dept.description || 'No description'}</p>
                                <div className="mt-4 flex gap-2">
                                    <button onClick={async () => { if (confirm('Delete department?')) { await hrmsApi.deleteDepartment(dept._id); fetchData(); } }} className="text-xs text-red-500 hover:underline">Delete</button>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => { const name = prompt('Dept Name?'); if (name) hrmsApi.createDepartment({ name }).then(fetchData); }} className="border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl p-5 text-gray-400 hover:text-blue-500 hover:border-blue-500 transition">＋ New Department</button>
                    </div>
                )}
            </div>
        </div>
    );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import api from "../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface User {
  _id: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "suspended";
  roleId?: { name: string; displayName: string };
  createdAt?: string;
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    inactive: "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400",
    suspended: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${m[status] || m.inactive}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Permissions ───────────────────────────────────────────────────────────────
const PERMISSIONS = [
  { key: "view_dashboard", label: "View Dashboard", icon: "📊" },
  { key: "create_project", label: "Create Project", icon: "📁" },
  { key: "assign_task", label: "Assign Tasks", icon: "📋" },
  { key: "manage_users", label: "Manage Users", icon: "👥" },
  { key: "export_reports", label: "Export Reports", icon: "📄" },
];

// ── Create User Modal ─────────────────────────────────────────────────────────
function CreateUserModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: { name: string; email: string; password: string; role: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Developer" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) { setError("Name and email are required"); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (err: any) { setError(err.message || "Failed to create user"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create User</h2>
          <button id="close-create-user-modal" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-500 transition">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
            <input type="text" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input type="email" placeholder="john@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temporary Password</label>
            <input type="password" placeholder="Leave blank for default" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select id="create-user-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Admin</option>
              <option>Project Manager</option>
              <option>Developer</option>
              <option>Designer</option>
              <option>QA Engineer</option>
              <option>Client Viewer</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition">Cancel</button>
            <button id="create-user-submit-btn" type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-60">{saving ? "Creating…" : "Create User"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Demo Users ────────────────────────────────────────────────────────────────
const DEMO_USERS: User[] = [
  { _id: "1", name: "John Doe", email: "john@company.com", status: "active", roleId: { name: "admin", displayName: "Admin" } },
  { _id: "2", name: "Maria Smith", email: "maria@company.com", status: "active", roleId: { name: "pm", displayName: "Project Manager" } },
  { _id: "3", name: "Alex Lee", email: "alex@company.com", status: "inactive", roleId: { name: "developer", displayName: "Developer" } },
  { _id: "4", name: "Anna Brown", email: "anna@company.com", status: "active", roleId: { name: "viewer", displayName: "Client Viewer" } },
  { _id: "5", name: "Dana R.", email: "dana@company.com", status: "suspended", roleId: { name: "developer", displayName: "Developer" } },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "permissions" | "organization">("users");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>({
    Admin: { view_dashboard: true, create_project: true, assign_task: true, manage_users: true, export_reports: true },
    "Project Manager": { view_dashboard: true, create_project: true, assign_task: true, manage_users: false, export_reports: true },
    Developer: { view_dashboard: true, create_project: false, assign_task: false, manage_users: false, export_reports: false },
    "Client Viewer": { view_dashboard: true, create_project: false, assign_task: false, manage_users: false, export_reports: false },
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>("/admin/users?limit=50");
      setUsers(res?.data?.data || []);
    } catch (_) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleCreate(data: { name: string; email: string; password: string; role: string }) {
    await api.post("/admin/users", data);
    await fetchUsers();
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await api.put(`/admin/users/${id}`, { status });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, status: status as User["status"] } : u)));
    } catch (_) {}
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (_) {}
  }

  const display = users.length ? users : DEMO_USERS;
  const filteredUsers = display.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = display.filter((u) => u.status === "active").length;
  const inactiveCount = display.filter((u) => u.status !== "active").length;

  return (
    <div className="space-y-8 pb-8">
      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} onSave={handleCreate} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage users, roles, and organization settings</p>
        </div>
        <button
          id="create-user-btn"
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md transition"
        >
          ＋ Create User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: display.length, color: "text-violet-600" },
          { label: "Active Users", value: activeCount, color: "text-emerald-600" },
          { label: "Inactive / Suspended", value: inactiveCount, color: "text-red-500" },
          { label: "Roles", value: Object.keys(rolePermissions).length, color: "text-blue-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800">
        {(["users", "permissions", "organization"] as const).map((tab) => (
          <button
            key={tab}
            id={`admin-tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition -mb-px ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* User Management */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <input
            id="admin-user-search"
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-800/50">
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-4 font-semibold">User</th>
                  <th className="px-5 py-4 font-semibold">Email</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading…</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">No users found</td></tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="border-t border-gray-50 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{user.email}</td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                        {user.roleId?.displayName || user.roleId?.name || "Member"}
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={user.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {user.status === "active" ? (
                            <button
                              id={`disable-user-${user._id}`}
                              onClick={() => handleStatusChange(user._id, "inactive")}
                              className="text-xs text-amber-600 hover:underline font-medium"
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              id={`enable-user-${user._id}`}
                              onClick={() => handleStatusChange(user._id, "active")}
                              className="text-xs text-emerald-600 hover:underline font-medium"
                            >
                              Enable
                            </button>
                          )}
                          <button
                            id={`delete-user-${user._id}`}
                            onClick={() => handleDelete(user._id)}
                            className="text-xs text-red-500 hover:underline font-medium ml-2"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permissions */}
      {activeTab === "permissions" && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-zinc-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Role Permissions Matrix</h2>
            <p className="text-xs text-gray-400 mt-1">Configure what each role can access and perform</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-800/50">
                <tr className="text-xs text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-4 text-left font-semibold">Permission</th>
                  {Object.keys(rolePermissions).map((role) => (
                    <th key={role} className="px-4 py-4 text-center font-semibold">{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((perm) => (
                  <tr key={perm.key} className="border-t border-gray-50 dark:border-zinc-800">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span>{perm.icon}</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{perm.label}</span>
                      </div>
                    </td>
                    {Object.keys(rolePermissions).map((role) => (
                      <td key={role} className="px-4 py-4 text-center">
                        <button
                          id={`perm-${role}-${perm.key}`}
                          onClick={() =>
                            setRolePermissions((prev) => ({
                              ...prev,
                              [role]: { ...prev[role], [perm.key]: !prev[role][perm.key] },
                            }))
                          }
                          className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs transition ${
                            rolePermissions[role]?.[perm.key]
                              ? "bg-emerald-500 text-white hover:bg-emerald-600"
                              : "bg-gray-200 dark:bg-zinc-700 text-gray-400 hover:bg-gray-300"
                          }`}
                        >
                          {rolePermissions[role]?.[perm.key] ? "✓" : "×"}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Organization */}
      {activeTab === "organization" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Organization Details</h3>
            <div className="space-y-4 text-sm">
              {[
                { label: "Organization Name", value: "LANSUB Corp" },
                { label: "Plan", value: "Enterprise" },
                { label: "Members Limit", value: "Unlimited" },
                { label: "Storage", value: "500 GB" },
                { label: "API Access", value: "Enabled" },
                { label: "SSO", value: "Enabled" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-zinc-800">
                  <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Plan & Billing</h3>
            <div className="bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl p-6 text-white">
              <p className="text-xs font-medium opacity-80 uppercase tracking-wider">Current Plan</p>
              <p className="text-2xl font-bold mt-1">Enterprise</p>
              <p className="text-xs opacity-70 mt-1">Renews on Apr 1, 2027</p>
              <button id="manage-plan-btn" className="mt-4 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                Manage Plan →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
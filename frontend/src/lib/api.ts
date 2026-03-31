// src/lib/api.ts
// Central API client – handles auth headers, token storage, and 401 redirects

const API_BASE = 'http://localhost:5000/api';

// ── Token helpers ────────────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('lansub-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.accessToken || parsed?.token || null;
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('lansub-auth');
    const parsed = raw ? JSON.parse(raw) : {};
    parsed.accessToken = token;
    localStorage.setItem('lansub-auth', JSON.stringify(parsed));
  } catch { }
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('lansub-auth');
}

// ── Core request ─────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') window.location.href = '/auth';
    throw new Error('Unauthorized – redirecting to login');
  }

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
  return json;
}

// ── HTTP convenience ─────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ── Domain-level API functions ────────────────────────────────────────────────

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ data: { accessToken: string; user: unknown } }>('/auth/login', { email, password }),
  register: (payload: unknown) =>
    api.post<{ data: { accessToken: string; user: unknown } }>('/auth/register', payload),
  me: () => api.get<{ data: unknown }>('/auth/me'),
};

// Projects
export const projectsApi = {
  getAll: (params = '') => api.get<any>(`/projects?limit=200${params}`),
  getById: (id: string) => api.get<any>(`/projects/${id}`),
  create: (body: unknown) => api.post<any>('/projects', body),
  update: (id: string, body: unknown) => api.put<any>(`/projects/${id}`, body),
  remove: (id: string) => api.delete<any>(`/projects/${id}`),
};

// Tasks
export const tasksApi = {
  getAll: (params = '') => api.get<any>(`/tasks?limit=200${params}`),
  getById: (id: string) => api.get<any>(`/tasks/${id}`),
  create: (body: unknown) => api.post<any>('/tasks', body),
  update: (id: string, body: unknown) => api.put<any>(`/tasks/${id}`, body),
  remove: (id: string) => api.delete<any>(`/tasks/${id}`),
};

// Timesheets
export const timesheetsApi = {
  getAll: (params = '') => api.get<any>(`/timesheets?limit=100${params}`),
  create: (body: unknown) => api.post<any>('/timesheets', body),
  update: (id: string, body: unknown) => api.put<any>(`/timesheets/${id}`, body),
  remove: (id: string) => api.delete<any>(`/timesheets/${id}`),
  clockIn: (body: unknown) => api.post<any>('/timesheets/clock-in', body),
  clockOut: (body: unknown) => api.post<any>('/timesheets/clock-out', body),
};

// Reports
export const reportsApi = {
  projects: () => api.get<any>('/reports/projects'),
  productivity: () => api.get<any>('/reports/productivity'),
  delays: () => api.get<any>('/reports/delays'),
};

// Notifications
export const notificationsApi = {
  getAll: (params = '') => api.get<any>(`/notifications?limit=50${params}`),
  markRead: (id: string) => api.put<any>(`/notifications/${id}/read`, {}),
  remove: (id: string) => api.delete<any>(`/notifications/${id}`),
};

// Activity
export const activityApi = {
  getAll: (params = '') => api.get<any>(`/activity?limit=50${params}`),
  recent: (limit = 8) => api.get<any>(`/activity/recent?limit=${limit}`),
};

// Discussions
export const discussionsApi = {
  getAll: (params = '') => api.get<any>(`/discussions?limit=30${params}`),
  getById: (id: string) => api.get<any>(`/discussions/${id}`),
  create: (body: unknown) => api.post<any>('/discussions', body),
  addComment: (id: string, content: string) =>
    api.post<any>(`/discussions/${id}/comments`, { content }),
};

// Users / Admin
export const adminApi = {
  getUsers: (params = '') => api.get<any>(`/admin/users?limit=100${params}`),
  createUser: (body: unknown) => api.post<any>('/admin/users', body),
  updateUser: (id: string, body: unknown) => api.put<any>(`/admin/users/${id}`, body),
  deleteUser: (id: string) => api.delete<any>(`/admin/users/${id}`),
};

// Dashboard
export const dashboardApi = {
  summary: () => api.get<any>('/dashboard/summary'),
  health: () => api.get<any>('/dashboard/health'),
  taskAnalytics: () => api.get<any>('/dashboard/task-analytics'),
  projectProgress: () => api.get<any>('/dashboard/project-progress'),
  workload: () => api.get<any>('/dashboard/workload'),
  costAnalysis: () => api.get<any>('/dashboard/cost-analysis'),
};

// HRMS / HR Admin
export const hrmsApi = {
  stats: () => api.get<any>('/hrms/stats'),
  // Employees
  getEmployees: (params = '') => api.get<any>(`/hrms/employees?limit=200${params}`),
  createEmployee: (body: unknown) => api.post<any>('/hrms/employees', body),
  updateEmployee: (id: string, body: unknown) => api.put<any>(`/hrms/employees/${id}`, body),
  deleteEmployee: (id: string) => api.delete<any>(`/hrms/employees/${id}`),
  // Departments
  getDepartments: () => api.get<any>('/hrms/departments'),
  createDepartment: (body: unknown) => api.post<any>('/hrms/departments', body),
  updateDepartment: (id: string, body: unknown) => api.put<any>(`/hrms/departments/${id}`, body),
  deleteDepartment: (id: string) => api.delete<any>(`/hrms/departments/${id}`),
  // Attendance & Leaves (Admin)
  getAttendance: (params = '') => api.get<any>(`/hrms/attendance?${params}`),
  getLeaves: (params = '') => api.get<any>(`/hrms/leaves?${params}`),
  updateLeaveStatus: (id: string, body: unknown) => api.put<any>(`/hrms/leaves/${id}/status`, body),
};

// Employee Self-Service
export const employeeApi = {
  getProfile: () => api.get<any>('/employee/me'),
  getStats: () => api.get<any>('/employee/stats'),
  getMonthlyChart: () => api.get<any>('/employee/attendance/chart'),
  getAttendance: (params = '') => api.get<any>(`/employee/attendance?${params}`),
  checkIn: () => api.post<any>('/employee/attendance/check-in', {}),
  checkOut: () => api.post<any>('/employee/attendance/check-out', {}),
  getLeaves: () => api.get<any>('/employee/leaves'),
  applyLeave: (body: unknown) => api.post<any>('/employee/leaves/apply', body),
};

// Compatibility for requested alias names
export const attendanceApi = {
  checkIn: employeeApi.checkIn,
  checkOut: employeeApi.checkOut,
  getHistory: employeeApi.getAttendance,
};
export const leaveApi = {
  apply: employeeApi.applyLeave,
  getHistory: employeeApi.getLeaves,
  approve: hrmsApi.updateLeaveStatus,
};
export const departmentApi = hrmsApi;
export const employeeProfileApi = employeeApi;

export default api;

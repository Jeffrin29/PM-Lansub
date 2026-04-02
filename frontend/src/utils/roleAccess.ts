/**
 * utils/roleAccess.ts
 * ─────────────────────────────────────────────────────
 * Central role-based access control helpers for the frontend.
 * Role names are determined from the backend's Role model (name field).
 * All role comparisons are lowercase-normalised.
 */

export type AppRole = 'admin' | 'project_manager' | 'hr' | 'employee' | 'org_admin' | 'super_admin' | string;

// ── Normalise a raw role object / string from /api/auth/me ──────────────────
export function normaliseRole(role: any): AppRole {
  if (!role) return 'employee';
  const name = (typeof role === 'string' ? role : role?.name || '').toLowerCase().trim();
  // Map org_admin / super_admin → admin for access control purposes
  if (name === 'org_admin' || name === 'super_admin') return 'admin';
  if (name === 'project_manager' || name === 'pm') return 'project_manager';
  if (name === 'hr' || name === 'hr_manager') return 'hr';
  if (name === 'employee' || name === 'member') return 'employee';
  // Unknown roles → safest fallback
  return name || 'employee';
}

// ── Route-level access map ────────────────────────────────────────────────────
// Keys are route prefixes; values are the roles ALLOWED to access them.
// An empty allowed list means everyone.
const ROUTE_ACCESS: Record<string, AppRole[]> = {
  '/dashboard/admin': ['admin', 'project_manager'], // PM only for timesheets sub-route
  '/dashboard/hrms': ['admin', 'hr'],
  '/dashboard/reports': ['admin', 'hr'],
};

/**
 * Returns true if the given role is permitted to access the route path.
 */
export function canAccessRoute(path: string, role: AppRole): boolean {
  const normalised = normaliseRole(role);
  for (const [prefix, allowed] of Object.entries(ROUTE_ACCESS)) {
    if (path.startsWith(prefix)) {
      // Special case: project_manager may ONLY access /dashboard/admin/timesheets
      if (normalised === 'project_manager' && prefix === '/dashboard/admin') {
        return path.startsWith('/dashboard/admin/timesheets');
      }
      return allowed.includes(normalised);
    }
  }
  // No restriction found → allow
  return true;
}

// ── Sidebar visibility ─────────────────────────────────────────────────────────
export interface NavItem {
  href: string;
  label: string;
  roles?: AppRole[]; // undefined = everyone can see
}

export const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',               label: 'Dashboard' },
  { href: '/dashboard/overview',       label: 'Overview' },
  { href: '/dashboard/projects',       label: 'Projects' },
  { href: '/dashboard/tasks',          label: 'Tasks' },
  { href: '/dashboard/timesheets',     label: 'Timesheets' },
  { href: '/dashboard/activity',       label: 'Activity Feed' },
  { href: '/dashboard/employee',       label: 'My Dashboard' },
  { href: '/dashboard/discussions',    label: 'Discussions' },
  { href: '/dashboard/notif',          label: 'Notifications' },
  { href: '/dashboard/ai',             label: 'AI Assistant' },
  // Privileged routes
  { href: '/dashboard/admin/timesheets', label: 'Timesheet Approval', roles: ['admin', 'project_manager'] },
  { href: '/dashboard/admin',          label: 'Admin',   roles: ['admin'] },
  { href: '/dashboard/hrms',           label: 'HRMS',    roles: ['admin', 'hr'] },
  { href: '/dashboard/reports',        label: 'Reports', roles: ['admin', 'hr'] },
];

/**
 * Returns the subset of ALL_NAV_ITEMS the given role may see.
 */
export function getVisibleNavItems(role: AppRole): NavItem[] {
  const normalised = normaliseRole(role);
  return ALL_NAV_ITEMS.filter((item) => {
    if (!item.roles) return true; // visible to everyone
    return item.roles.includes(normalised);
  });
}

// ── Quick boolean helpers ─────────────────────────────────────────────────────
export const isAdmin = (role: AppRole) => normaliseRole(role) === 'admin';
export const isPM    = (role: AppRole) => normaliseRole(role) === 'project_manager';
export const isHR    = (role: AppRole) => normaliseRole(role) === 'hr';
export const isEmployee = (role: AppRole) => normaliseRole(role) === 'employee';

/** Can this role approve / reject timesheets? */
export const canApproveTimesheets = (role: AppRole) =>
  isAdmin(role) || isPM(role);

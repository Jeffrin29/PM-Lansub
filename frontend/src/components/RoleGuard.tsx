'use client';

/**
 * components/RoleGuard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Wraps any content that should only be visible / accessible to specific roles.
 *
 * Usage (at layout or page level):
 *   <RoleGuard allowed={['admin', 'project_manager']}>
 *     <AdminPage />
 *   </RoleGuard>
 *
 * If the user's role isn't in `allowed`, renders `fallback` (default: access-
 * denied message) instead of the children.
 *
 * Set `redirect` to a path to push the router there on denial instead.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { type AppRole } from '../utils/roleAccess';

interface RoleGuardProps {
  /** Roles that are allowed to see/access the children. */
  allowed: AppRole[];
  /** Children to render when access is granted. */
  children: React.ReactNode;
  /**
   * Path to redirect to when access is denied.
   * If omitted, renders the fallback UI instead.
   */
  redirect?: string;
  /**
   * Custom fallback UI. Defaults to a standard "Access Denied" card.
   */
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
      <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    </div>
    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
    <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm">
      You don&apos;t have permission to view this page.
      Please contact your administrator if you believe this is a mistake.
    </p>
    <a
      href="/dashboard"
      className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
    >
      Back to Dashboard
    </a>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <p className="text-sm text-gray-500 dark:text-gray-400">Verifying access…</p>
    </div>
  </div>
);

export default function RoleGuard({
  allowed,
  children,
  redirect,
  fallback,
}: RoleGuardProps) {
  const { role: hookRole, loading } = useCurrentUser();
  const router = useRouter();

  // Instant Check: Read role and token from localStorage
  const getAuthData = () => {
    if (typeof window === 'undefined') return { token: null, role: null };
    try {
      const raw = localStorage.getItem('lansub-auth');
      if (!raw) return { token: null, role: null };
      const parsed = JSON.parse(raw);
      return { 
        token: parsed.accessToken || parsed.token,
        role: parsed.role || 'employee' 
      };
    } catch { return { token: null, role: null }; }
  };

  const { token, role: storedRole } = getAuthData();
  const currentRole = hookRole !== 'employee' ? hookRole : (storedRole || 'employee');

  // Handle Auth Redirect
  React.useEffect(() => {
    if (!token && !loading) {
      router.replace('/auth');
    }
  }, [token, loading, router]);

  if (loading && !storedRole) return <LoadingSpinner />;

  const hasAccess = allowed.includes(currentRole as AppRole);

  if (!hasAccess) {
    if (redirect) {
      router.replace(redirect);
      return <LoadingSpinner />;
    }
    // Default redirect to employee dashboard if no access to current dashboard
    if (!fallback && typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard/')) {
      router.replace('/dashboard/employee');
      return <LoadingSpinner />;
    }
    return <>{fallback ?? <DefaultFallback />}</>;
  }

  return <>{children}</>;
}

/**
 * hooks/useCurrentUser.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches GET /api/auth/me once per session (cached in module scope so
 * multiple components sharing this hook hit the network only once).
 * Returns { user, role, loading, error }.
 */
'use client';

import { useState, useEffect } from 'react';
import { authApi } from '../lib/api';
import { normaliseRole, type AppRole } from '../utils/roleAccess';

export interface CurrentUser {
  _id: string;
  name: string;
  email: string;
  organizationId: string | { _id: string; name: string };
  roleId?: any;
  role?: any;   // populated role object from backend
  status: string;
}

interface UseCurrentUserResult {
  user: CurrentUser | null;
  role: AppRole;
  loading: boolean;
  error: string | null;
}

// Module-level cache so the request fires only once per page lifecycle
let _cached: CurrentUser | null = null;
let _promise: Promise<CurrentUser | null> | null = null;

async function fetchMe(): Promise<CurrentUser | null> {
  if (_cached) return _cached;
  if (_promise) return _promise;

  _promise = authApi.me().then((res: any) => {
    const user = res?.data ?? null;
    _cached = user;
    _promise = null;
    return user;
  }).catch(() => {
    _promise = null;
    return null;
  });

  return _promise;
}

/** Call this to clear the cache (e.g. after logout). */
export function clearUserCache() {
  _cached = null;
  _promise = null;
}

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser]     = useState<CurrentUser | null>(_cached);
  const [loading, setLoading] = useState<boolean>(!_cached);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (_cached) {
      setUser(_cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchMe().then((u) => {
      if (!cancelled) {
        setUser(u);
        setLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err?.message || 'Failed to load user');
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Extract role from whichever field the backend populates
  const rawRole = user?.roleId ?? user?.role ?? null;
  const role: AppRole = normaliseRole(rawRole);

  return { user, role, loading, error };
}

'use strict';
const { errorResponse } = require('../utils/helpers');

/**
 * requireRole(roles) — legacy-compatible RBAC middleware.
 *
 * Works with req.user.role which is now always a plain lowercase string
 * (set by authenticate.js). Supports 'manager' as alias for 'project_manager'.
 *
 * Usage: requireRole(['admin', 'hr'])
 */
const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', 401);
    }

    const role = (req.user.role || '').toLowerCase();

    // admin always passes
    if (role === 'admin') return next();

    // Normalize the allowed list: 'manager' alias → 'project_manager'
    const normalizedAllowed = roles.map((r) => {
      const lower = r.toLowerCase();
      return lower === 'manager' ? 'project_manager' : lower;
    });

    // Also normalize incoming role: 'manager' → 'project_manager'
    const normalizedRole = role === 'manager' ? 'project_manager' : role;

    if (!normalizedAllowed.includes(normalizedRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = { requireRole };


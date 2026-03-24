'use strict';
const { errorResponse } = require('../utils/helpers');

/**
 * requireRole - RBAC middleware that checks the user's role name.
 *
 * Usage:
 *   router.get('/hrms', authenticate, requireRole(['Admin', 'Manager']), controller)
 *
 * Checks req.user.role.name OR req.user.role.displayName against the allowed array (case-insensitive).
 * Also passes super_admin through unconditionally.
 *
 * @param {string[]} allowedRoles - e.g. ['Admin', 'Manager']
 */
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', 401);
    }

    const role = req.user.role;
    if (!role) {
      return errorResponse(res, 'User has no role assigned.', 403);
    }

    // Super admin always passes
    if (role.isSystemRole && role.name === 'super_admin') {
      return next();
    }

    const roleName = (role.name || '').toLowerCase();
    const roleDisplay = (role.displayName || '').toLowerCase();

    const allowed = allowedRoles.map((r) => r.toLowerCase());

    if (allowed.includes(roleName) || allowed.includes(roleDisplay)) {
      return next();
    }

    return errorResponse(
      res,
      `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      403
    );
  };
};

module.exports = { requireRole };

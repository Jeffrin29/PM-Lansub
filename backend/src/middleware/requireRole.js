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
const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', 401);
    }

    const role = (req.user?.role || '').toLowerCase();

    if (!roles.map(r => r.toLowerCase()).includes(role)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${roles.join(", ")}`
      });
    }

    next();
  };
};

module.exports = { requireRole };

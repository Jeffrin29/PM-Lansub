'use strict';
const { errorResponse } = require('../utils/helpers');

/**
 * checkRole(...allowedRoles)
 *
 * Usage:
 *   router.get('/hrms', authenticate, checkRole('admin', 'hr'), controller)
 *
 * req.user.role is always a plain lowercase string (set by authenticate.js).
 * Allowed role names: 'admin', 'hr', 'project_manager', 'employee'
 *
 * 'admin' always passes (full access).
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', 401);
    }

    const role = (req.user.role || '').toLowerCase();

    // admin always has full access
    if (role === 'admin') return next();

    const allowed = allowedRoles.map((r) => r.toLowerCase());
    if (!allowed.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = { checkRole };

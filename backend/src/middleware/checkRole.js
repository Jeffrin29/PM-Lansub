'use strict';
const { errorResponse } = require('../utils/helpers');

/**
 * checkRole(...allowedRoles)
 *
 * Usage:
 *   router.get('/hrms', authenticate, checkRole('admin', 'hr'), controller)
 *
 * req.user.role is already normalized to lowercase in authenticate.js
 * Standardized roles: 'admin', 'hr', 'project_manager', 'employee'
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', 401);
    }

    const userRole = (req.user.role || '').toLowerCase();

    // Admin has superuser access
    if (userRole === 'admin') return next();

    // Map 'manager' alias to 'project_manager' for both userRole and allowedRoles
    const normalizedUserRole = userRole === 'manager' ? 'project_manager' : userRole;
    
    const normalizedAllowed = allowedRoles.map(r => {
      const lower = r.toLowerCase();
      return lower === 'manager' ? 'project_manager' : lower;
    });

    if (!normalizedAllowed.includes(normalizedUserRole)) {
      console.warn(`[RBAC] Access Denied: User ${req.user.email} (${userRole}) attempted restricted path. Allowed: ${allowedRoles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = { checkRole };

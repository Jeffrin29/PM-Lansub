const Permission = require('../models/Permission');
const { errorResponse } = require('../utils/helpers');

/**
 * Require specific permission(s) — all listed permissions must be held
 * Usage: authorize('create_project')  OR  authorize('edit_project', 'assign_task')
 */
const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return errorResponse(res, 'Authentication required.', 401);
      }

      const role = (req.user.role || '').toLowerCase();

      // admin bypasses all permission checks
      if (role === 'admin') return next();

      // For non-admin roles, check permissions from roleId if available
      let userPermissions = [];
      if (req.user.roleId) {
        const RoleModel = require('../models/Role');
        const roleDoc = await RoleModel.findById(req.user.roleId)
          .populate('permissions', 'name').lean();
        if (roleDoc && roleDoc.permissions) {
          userPermissions = roleDoc.permissions.map(p => p.name || p);
        }
      }

      const missing = requiredPermissions.filter(p => !userPermissions.includes(p));
      if (missing.length > 0) {
        return errorResponse(
          res,
          `Access denied. Missing permission(s): ${missing.join(', ')}`,
          403
        );
      }

      next();
    } catch (err) {
      return errorResponse(res, 'Permission check failed.', 500);
    }
  };
};

/**
 * Require ANY one of the listed permissions
 */
const authorizeAny = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) return errorResponse(res, 'Authentication required.', 401);

      const role = (req.user.role || '').toLowerCase();

      // admin bypasses all
      if (role === 'admin') return next();

      let userPermissions = [];
      if (req.user.roleId) {
        const RoleModel = require('../models/Role');
        const roleDoc = await RoleModel.findById(req.user.roleId)
          .populate('permissions', 'name').lean();
        if (roleDoc && roleDoc.permissions) {
          userPermissions = roleDoc.permissions.map(p => p.name || p);
        }
      }

      const hasAny = requiredPermissions.some(p => userPermissions.includes(p));
      if (!hasAny) {
        return errorResponse(res, 'Access denied. Insufficient permissions.', 403);
      }

      next();
    } catch (err) {
      return errorResponse(res, 'Permission check failed.', 500);
    }
  };
};

/**
 * Require admin role (org admin or super admin — both normalized to 'admin' by authenticate.js)
 */
const requireOrgAdmin = (req, res, next) => {
  if (!req.user) return errorResponse(res, 'Authentication required.', 401);
  const role = (req.user.role || '').toLowerCase();
  if (role !== 'admin') {
    return errorResponse(res, 'Organization admin access required.', 403);
  }
  next();
};

module.exports = { authorize, authorizeAny, requireOrgAdmin };

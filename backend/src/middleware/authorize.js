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

      const role = req.user.role;
      if (!role) {
        return errorResponse(res, 'User has no role assigned.', 403);
      }

      // System admins bypass all permission checks
      if (role.isSystemRole && role.name === 'super_admin') {
        return next();
      }

      // Populate permissions if they are ObjectID refs (not already strings)
      let userPermissions = role.permissions || [];
      if (userPermissions.length > 0 && typeof userPermissions[0] === 'object' && userPermissions[0]._id) {
        // Already populated objects
        userPermissions = userPermissions.map((p) => p.name);
      } else if (userPermissions.length > 0 && typeof userPermissions[0] !== 'string') {
        // Fetch from DB
        const perms = await Permission.find({ _id: { $in: userPermissions } }).select('name').lean();
        userPermissions = perms.map((p) => p.name);
      }

      const missing = requiredPermissions.filter((p) => !userPermissions.includes(p));
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

      const role = req.user.role;
      if (!role) return errorResponse(res, 'User has no role assigned.', 403);

      if (role.isSystemRole && role.name === 'super_admin') return next();

      let userPermissions = role.permissions || [];
      if (userPermissions.length > 0 && typeof userPermissions[0] !== 'string') {
        const perms = await Permission.find({ _id: { $in: userPermissions } }).select('name').lean();
        userPermissions = perms.map((p) => p.name);
      }

      const hasAny = requiredPermissions.some((p) => userPermissions.includes(p));
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
 * Require org admin or super admin role
 */
const requireOrgAdmin = (req, res, next) => {
  if (!req.user) return errorResponse(res, 'Authentication required.', 401);
  const role = req.user.role;
  if (!role) return errorResponse(res, 'No role assigned.', 403);
  const adminRoles = ['super_admin', 'org_admin'];
  if (!adminRoles.includes(role.name)) {
    return errorResponse(res, 'Organization admin access required.', 403);
  }
  next();
};

module.exports = { authorize, authorizeAny, requireOrgAdmin };

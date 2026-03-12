const { errorResponse } = require('../utils/helpers');

/**
 * organizationIsolation — ensures every DB query is scoped to the authenticated user's org.
 *
 * Attaches req.orgFilter = { organizationId: req.user.organizationId }
 * for controllers to spread into their mongoose queries.
 */
const organizationIsolation = (req, res, next) => {
  if (!req.user || !req.user.organizationId) {
    return errorResponse(res, 'Organization context is missing.', 403);
  }

  req.orgFilter = { organizationId: req.user.organizationId };
  next();
};

/**
 * enforceOrgParam — For routes that accept :orgId param, ensure the param matches
 * the authenticated user's org (prevents horizontal privilege escalation).
 */
const enforceOrgParam = (req, res, next) => {
  if (!req.user) return errorResponse(res, 'Authentication required.', 401);

  const paramOrgId = req.params.orgId || req.body.organizationId;
  if (paramOrgId && paramOrgId !== req.user.organizationId) {
    return errorResponse(res, 'Cross-organization access is not permitted.', 403);
  }
  next();
};

module.exports = { organizationIsolation, enforceOrgParam };

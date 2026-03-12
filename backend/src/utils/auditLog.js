const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

/**
 * Create an audit log entry (fire-and-forget, non-blocking)
 *
 * @param {Object} params
 * @param {string|null}  params.userId
 * @param {string|null}  params.organizationId
 * @param {string}       params.action         - e.g. 'LOGIN', 'CREATE_PROJECT'
 * @param {string}       params.entityType     - e.g. 'auth', 'project'
 * @param {string|null}  params.entityId
 * @param {string}       params.description
 * @param {Object|null}  params.changes        - { before, after }
 * @param {string}       params.ipAddress
 * @param {string}       params.userAgent
 * @param {string}       params.status         - 'success' | 'failure' | 'warning'
 * @param {Object|null}  params.metadata
 */
const createAuditLog = async ({
  userId = null,
  organizationId = null,
  action,
  entityType,
  entityId = null,
  description = '',
  changes = null,
  ipAddress = null,
  userAgent = null,
  status = 'success',
  metadata = null,
}) => {
  try {
    await AuditLog.create({
      userId,
      organizationId,
      action: action.toUpperCase(),
      entityType,
      entityId,
      description,
      changes,
      ipAddress,
      userAgent,
      status,
      metadata,
    });
  } catch (err) {
    // Never throw — audit logging must not break main flows
    logger.error(`AuditLog write failed: ${err.message}`);
  }
};

module.exports = { createAuditLog };

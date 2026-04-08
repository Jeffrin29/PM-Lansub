'use strict';
const Activity = require('../models/Activity');

/**
 * Log an activity to the database
 * @param {string} userId - User performing the action
 * @param {string} organizationId - Organization ID
 * @param {string} action - Action identifier (e.g., 'task:created')
 * @param {string} entityType - Entity type ('task', 'project', etc.)
 * @param {string} [entityId] - Reference ID
 * @param {object} [metadata] - Optional additional info
 */
const logActivity = async ({ userId, organizationId, action, entityType, entityId = null, metadata = {} }) => {
  try {
    await Activity.create({
      userId,
      organizationId,
      action,
      entityType,
      entityId,
      metadata,
      createdBy: userId,
    });
  } catch (err) {
    console.error('❌ Activity Log Error:', err.message);
  }
};

module.exports = { logActivity };

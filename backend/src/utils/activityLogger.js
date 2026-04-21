const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

/**
 * Logs activity with metadata and description
 * { userId, action, taskId, description, metadata }
 */
const logTaskActivity = async ({ userId, action, taskId, description, metadata }) => {
  try {
    const activity = {
      userId,
      action,
      module: "task",
      taskId,
      timestamp: new Date(),
      metadata: metadata || {}
    };

    await AuditLog.create({
      userId,
      action: action.toUpperCase(),
      entityType: 'task',
      entityId: taskId,
      description: description || `Task ${action}: ${taskId}`,
      metadata: activity
    });

    logger.info(`Activity Recorded: ${JSON.stringify(activity)}`);
  } catch (err) {
    logger.error(`Failed to log activity: ${err.message}`);
  }
};

module.exports = { logTaskActivity };

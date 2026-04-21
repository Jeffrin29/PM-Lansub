'use strict';
const Notification = require('../models/Notification');

/**
 * Send a notification to a user
 * @param {string} userId - Recipient
 * @param {string} organizationId - Org ID
 * @param {string} title - Brief title
 * @param {string} message - Full message
 * @param {string} type - Notification type (trigger)
 * @param {object} [link] - Deep link detail
 */
const sendNotification = async ({ userId, organizationId, title, message, type, link = {} }) => {
  try {
    await Notification.create({
      userId,
      organizationId,
      title,
      message,
      type,
      link: {
        entityType: link.type || null,
        entityId: link.id || null,
        url: link.url || null
      }
    });
  } catch (err) {
    console.error('❌ Notification Error:', err.message);
  }
};

module.exports = { sendNotification };

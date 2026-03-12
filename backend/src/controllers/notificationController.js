const Notification = require('../models/Notification');
const { successResponse, errorResponse, getPagination, paginatedResponse } = require('../utils/helpers');

// ─── List Notifications (for current user) ────────────────────────────────────
exports.getNotifications = async (req, res, next) => {
  try {
    const { skip, limit, page, sort } = getPagination(req.query);
    const { type, readStatus } = req.query;

    const filter = {
      userId: req.user.userId,
      ...req.orgFilter,
    };
    if (type) filter.type = type;
    if (readStatus !== undefined) filter.readStatus = readStatus === 'true';

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    const unreadCount = await Notification.countDocuments({
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      readStatus: false,
    });

    return successResponse(
      res,
      { ...paginatedResponse(notifications, total, page, limit), unreadCount },
      'Notifications fetched.'
    );
  } catch (err) {
    next(err);
  }
};

// ─── Mark One as Read ─────────────────────────────────────────────────────────
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId, organizationId: req.user.organizationId },
      { readStatus: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) return errorResponse(res, 'Notification not found.', 404);
    return successResponse(res, notification, 'Marked as read.');
  } catch (err) {
    next(err);
  }
};

// ─── Mark All as Read ─────────────────────────────────────────────────────────
exports.markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.userId, organizationId: req.user.organizationId, readStatus: false },
      { readStatus: true, readAt: new Date() }
    );
    return successResponse(res, { updated: result.modifiedCount }, 'All notifications marked as read.');
  } catch (err) {
    next(err);
  }
};

// ─── Delete a Notification ────────────────────────────────────────────────────
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
      organizationId: req.user.organizationId,
    });
    if (!notification) return errorResponse(res, 'Notification not found.', 404);
    return successResponse(res, null, 'Notification deleted.');
  } catch (err) {
    next(err);
  }
};

// ─── Delete All Read Notifications ────────────────────────────────────────────
exports.deleteAllRead = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      readStatus: true,
    });
    return successResponse(res, { deleted: result.deletedCount }, 'Read notifications cleared.');
  } catch (err) {
    next(err);
  }
};

'use strict';
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');
const { successResponse, errorResponse } = require('../utils/helpers');

exports.getNotifications = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { read } = req.query;

    const filter = { userId: req.user._id, organizationId };
    
    // ✅ BIRTHDAY TRIGGER (Demo logic)
    const currentUser = await User.findById(req.user._id);
    if (currentUser?.birthday) {
      const today = new Date();
      const bday = new Date(currentUser.birthday);
      if (today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate()) {
        const alreadyNotified = await Notification.findOne({
          userId: req.user._id,
          type: 'birthday',
          createdAt: { 
            $gte: new Date(today.setHours(0,0,0,0)), 
            $lte: new Date(today.setHours(23,59,59,999)) 
          }
        });
        if (!alreadyNotified) {
          await sendNotification({
            userId: req.user._id,
            organizationId,
            title: 'Happy Birthday!',
            message: `The LANSUB team wishes you a fantastic day! 🎂`,
            type: 'birthday'
          });
        }
      }
    }

    if (read !== undefined) {
      filter.readStatus = read === 'true';
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return successResponse(res, notifications, 'Notifications fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { readStatus: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) return errorResponse(res, 'Notification not found.', 404);
    return successResponse(res, notification, 'Marked as read.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, readStatus: false },
      { readStatus: true, readAt: new Date() }
    );
    return successResponse(res, null, 'All notifications marked as read.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

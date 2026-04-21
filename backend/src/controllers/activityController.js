'use strict';
const Activity = require('../models/Activity');
const { successResponse, errorResponse } = require('../utils/helpers');

exports.getActivities = async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase();
    const userId = req.user.userId;
    const { organizationId } = req.user;
    const { module } = req.query;

    const filter = { organizationId };

    // RBAC: employees only see their own activity
    if (role === 'employee') {
      filter.userId = userId;
    }

    if (module && module !== 'all') {
      filter.entityType = module.toLowerCase();
    }

    const activities = await Activity.find(filter)
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return successResponse(res, activities || [], 'Activities fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase();
    const userId = req.user.userId;
    const { organizationId } = req.user;
    const limit = parseInt(req.query.limit) || 8;

    const filter = { organizationId };

    // RBAC: employees only see their own activity
    if (role === 'employee') {
      filter.userId = userId;
    }

    const activities = await Activity.find(filter)
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return successResponse(res, activities || [], 'Recent activities fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

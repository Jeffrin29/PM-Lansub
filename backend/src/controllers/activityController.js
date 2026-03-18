'use strict';
const Activity = require('../models/Activity');
const { successResponse, errorResponse, getPagination, paginatedResponse } = require('../utils/helpers');

// GET /api/activity
const getActivity = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { page, limit, skip, sort } = getPagination(req.query);
    const filter = { organizationId };
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.entityType) filter.entityType = req.query.entityType;
    if (req.query.entityId) filter.entityId = req.query.entityId;

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      Activity.countDocuments(filter),
    ]);

    return successResponse(res, paginatedResponse(activities, total, page, limit));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// POST /api/activity
const createActivity = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { action, entityType, entityId, metadata } = req.body;

    const activity = await Activity.create({
      userId: req.user._id,
      organizationId,
      action,
      entityType,
      entityId: entityId || null,
      metadata: metadata || {},
      createdBy: req.user._id,
    });

    return successResponse(res, activity, 'Activity logged', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = { getActivity, createActivity };

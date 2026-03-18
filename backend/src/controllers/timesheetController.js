'use strict';
const Timesheet = require('../models/Timesheet');
const { successResponse, errorResponse, getPagination, paginatedResponse } = require('../utils/helpers');

// GET /api/timesheets
const getTimesheets = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { page, limit, skip, sort } = getPagination(req.query);
    const filter = { organizationId };

    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    if (req.query.groupBy === 'date') sort.date = -1;
    if (req.query.groupBy === 'project') sort.projectId = 1;

    const [timesheets, total] = await Promise.all([
      Timesheet.find(filter)
        .sort(Object.keys(sort).length ? sort : { date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .populate('taskId', 'title')
        .populate('projectId', 'projectTitle')
        .lean(),
      Timesheet.countDocuments(filter),
    ]);

    return successResponse(res, paginatedResponse(timesheets, total, page, limit));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// POST /api/timesheets
const createTimesheet = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { taskId, projectId, hours, billingType, notes, date } = req.body;

    const timesheet = await Timesheet.create({
      userId: req.user._id,
      taskId: taskId || null,
      projectId,
      organizationId,
      hours,
      billingType: billingType || 'billable',
      notes: notes || '',
      date: date ? new Date(date) : new Date(),
      createdBy: req.user._id,
    });

    const populated = await timesheet.populate([
      { path: 'userId', select: 'name email' },
      { path: 'taskId', select: 'title' },
      { path: 'projectId', select: 'projectTitle' },
    ]);

    return successResponse(res, populated, 'Timesheet created', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// PUT /api/timesheets/:id
const updateTimesheet = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const sheet = await Timesheet.findOne({ _id: req.params.id, organizationId });
    if (!sheet) return errorResponse(res, 'Timesheet not found', 404);

    const { hours, billingType, notes, status, date } = req.body;

    // Approval flow permission: level >= 50 or admin/pm name
    const canReview = req.user.role?.level >= 50 || ['admin', 'pm', 'org_admin'].includes(req.user.role?.name?.toLowerCase());

    if (status && ['approved', 'rejected'].includes(status)) {
      if (!canReview) {
        return errorResponse(res, 'Unauthorized to approve/reject timesheets', 403);
      }
      sheet.status = status;
      sheet.reviewedBy = req.user._id;
      sheet.reviewedAt = new Date();

      // Emit socket notification
      if (req.io) {
        req.io.to(`org:${organizationId}`).emit('timesheet:updated', {
          id: sheet._id,
          status,
          userId: sheet.userId,
        });
      }
    } else {
      // Normal update
      if (req.user.userId !== sheet.userId.toString() && !canReview) {
        return errorResponse(res, 'Unauthorized to update this timesheet', 403);
      }
      if (hours !== undefined) sheet.hours = hours;
      if (billingType) sheet.billingType = billingType;
      if (notes !== undefined) sheet.notes = notes;
      if (date) sheet.date = new Date(date);
    }

    await sheet.save();
    return successResponse(res, sheet, 'Timesheet updated');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// DELETE /api/timesheets/:id
const deleteTimesheet = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const sheet = await Timesheet.findOneAndDelete({ _id: req.params.id, organizationId });
    if (!sheet) return errorResponse(res, 'Timesheet not found', 404);
    return successResponse(res, null, 'Timesheet deleted');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = { getTimesheets, createTimesheet, updateTimesheet, deleteTimesheet };

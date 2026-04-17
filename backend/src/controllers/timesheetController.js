'use strict';
const Timesheet = require('../models/Timesheet');
const { successResponse, errorResponse, getPagination, paginatedResponse } = require('../utils/helpers');

// GET /api/timesheets
const getTimesheets = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { page, limit, skip, sort } = getPagination(req.query);
    const filter = { ...req.orgFilter };

    if (role === 'employee') {
      filter.user = userId;
    } else if (req.query.userId || req.query.user) {
      filter.user = req.query.userId || req.query.user;
    }

    if (req.query.projectId || req.query.project) filter.project = req.query.projectId || req.query.project;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    if (req.query.groupBy === 'date') sort.date = -1;
    if (req.query.groupBy === 'project') sort.project = 1;

    const [timesheets, total] = await Promise.all([
      Timesheet.find(filter)
        .sort(Object.keys(sort).length ? sort : { date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .populate('task', 'title')
        .populate('project', 'name')
        .lean(),
      Timesheet.countDocuments(filter),
    ]);

    return successResponse(res, paginatedResponse(timesheets || [], total || 0, page, limit));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// POST /api/timesheets
const createTimesheet = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const { task, project, taskId, projectId, hours, billingType, notes, date } = req.body;

    const timesheet = await Timesheet.create({
      user: userId,
      task: task || taskId || null,
      project: project || projectId,
      organizationId,
      hours,
      billingType: billingType || 'billable',
      notes: notes || '',
      date: date ? new Date(date) : new Date(),
      createdBy: userId,
    });

    const populated = await timesheet.populate([
      { path: 'user', select: 'name email' },
      { path: 'task', select: 'title' },
      { path: 'project', select: 'name' },
    ]);

    return successResponse(res, populated, 'Timesheet created', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// PATCH /api/timesheets/:id/approve
const approveTimesheet = async (req, res) => {
  try {
    const sheet = await Timesheet.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!sheet) return errorResponse(res, 'Timesheet not found', 404);

    sheet.status = 'approved';
    sheet.reviewedBy = req.user.userId;
    sheet.reviewedAt = new Date();
    await sheet.save();

    return successResponse(res, sheet, 'Timesheet approved');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// PATCH /api/timesheets/:id/reject
const rejectTimesheet = async (req, res) => {
  try {
    const sheet = await Timesheet.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!sheet) return errorResponse(res, 'Timesheet not found', 404);

    sheet.status = 'rejected';
    sheet.reviewedBy = req.user.userId;
    sheet.reviewedAt = new Date();
    await sheet.save();

    return successResponse(res, sheet, 'Timesheet rejected');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// PUT /api/timesheets/:id
const updateTimesheet = async (req, res) => {
  try {
    const sheet = await Timesheet.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!sheet) return errorResponse(res, 'Timesheet not found', 404);

    const { hours, billingType, notes, status, date } = req.body;
    const { role, userId } = req.user;

    // Ownership check
    if (userId !== sheet.user.toString()) {
      const canReview = ['admin', 'hr', 'project_manager', 'manager'].includes(role);
      if (!canReview) return errorResponse(res, 'Unauthorized to update this timesheet', 403);
    }

    if (hours !== undefined) sheet.hours = hours;
    if (billingType) sheet.billingType = billingType;
    if (notes !== undefined) sheet.notes = notes;
    if (date) sheet.date = new Date(date);

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      const canReview = ['admin', 'hr', 'project_manager', 'manager'].includes(role);
      if (canReview) {
        sheet.status = status;
        sheet.reviewedBy = userId;
        sheet.reviewedAt = new Date();
      }
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
    const sheet = await Timesheet.findOneAndDelete({ _id: req.params.id, ...req.orgFilter });
    if (!sheet) return errorResponse(res, 'Timesheet not found', 404);
    return successResponse(res, null, 'Timesheet deleted');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = { getTimesheets, createTimesheet, updateTimesheet, deleteTimesheet, approveTimesheet, rejectTimesheet };

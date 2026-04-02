'use strict';
const Timesheet      = require('../models/Timesheet');
const Notification   = require('../models/Notification');
const { createAuditLog } = require('../utils/auditLog');
const { successResponse, errorResponse, getPagination, paginatedResponse } = require('../utils/helpers');

// ── Role helpers ──────────────────────────────────────────────────────────────
/**
 * Returns true if the requesting user has elevated access
 * (admin / project_manager / org_admin / hr or role.level >= 50).
 */
const isElevatedRole = (user) => {
  const role = user.role;
  if (!role) return false;
  if (role.level >= 50) return true;
  const name = (role.name || '').toLowerCase();
  return ['admin', 'org_admin', 'super_admin', 'pm', 'project_manager', 'hr', 'hr_manager'].includes(name);
};

// ── GET /api/timesheets ───────────────────────────────────────────────────────
const getTimesheets = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { page, limit, skip, sort } = getPagination(req.query);
    const filter = { organizationId };

    // RBAC DATA ISOLATION — employees only see their own records
    if (!isElevatedRole(req.user)) {
      filter.userId = req.user._id;
    }

    // Optional query filters (respected for all roles)
    if (req.query.userId && isElevatedRole(req.user)) filter.userId = req.query.userId;
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate)   filter.date.$lte = new Date(req.query.endDate);
    }

    if (req.query.groupBy === 'date')    sort.date      = -1;
    if (req.query.groupBy === 'project') sort.projectId =  1;

    const [timesheets, total] = await Promise.all([
      Timesheet.find(filter)
        .sort(Object.keys(sort).length ? sort : { date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId',    'name email')
        .populate('taskId',    'title')
        .populate('projectId', 'projectTitle')
        .lean(),
      Timesheet.countDocuments(filter),
    ]);

    return successResponse(res, paginatedResponse(timesheets, total, page, limit));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ── POST /api/timesheets ──────────────────────────────────────────────────────
const createTimesheet = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { taskId, projectId, hours, billingType, notes, date } = req.body;

    const timesheet = await Timesheet.create({
      userId:      req.user._id,
      taskId:      taskId || null,
      projectId,
      organizationId,
      hours,
      billingType: billingType || 'billable',
      notes:       notes || '',
      date:        date ? new Date(date) : new Date(),
      status:      'pending',          // always starts as pending
      createdBy:   req.user._id,
    });

    const populated = await timesheet.populate([
      { path: 'userId',    select: 'name email' },
      { path: 'taskId',    select: 'title' },
      { path: 'projectId', select: 'projectTitle' },
    ]);

    return successResponse(res, populated, 'Timesheet created', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ── PATCH /api/timesheets/:id  (approve / reject) ────────────────────────────
const approveTimesheet = async (req, res) => {
  try {
    const { organizationId } = req.user;

    if (!isElevatedRole(req.user)) {
      return errorResponse(res, 'Unauthorized to approve/reject timesheets', 403);
    }

    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return errorResponse(res, 'Status must be "approved" or "rejected"', 400);
    }

    const sheet = await Timesheet.findOne({ _id: req.params.id, organizationId });
    if (!sheet) return errorResponse(res, 'Timesheet not found', 404);

    sheet.status     = status;
    sheet.reviewedBy = req.user._id;
    sheet.reviewedAt = new Date();
    await sheet.save();

    // ── Notify the timesheet owner ───────────────────────────────────────────
    try {
      await Notification.create({
        userId:         sheet.userId,
        organizationId: sheet.organizationId,
        title:          `Timesheet ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message:        `Your timesheet entry for ${new Date(sheet.date).toLocaleDateString()} (${sheet.hours}h) has been ${status}.`,
        type:           'system',
        priority:       status === 'rejected' ? 'high' : 'normal',
      });
    } catch (_) { /* non-critical — don't fail the main request */ }

    if (req.io) {
      req.io.to(`org:${organizationId}`).emit('timesheet:updated', {
        id: sheet._id, status, userId: sheet.userId,
      });
    }

    // ── Audit log ──────────────────────────────────────────────────────────
    createAuditLog({
      userId:         req.user._id,
      organizationId: sheet.organizationId,
      action:         `TIMESHEET_${status.toUpperCase()}`,
      entityType:     'timesheet',
      entityId:       sheet._id,
      description:    `Timesheet ${status} for user ${sheet.userId} (${sheet.hours}h on ${new Date(sheet.date).toISOString().slice(0, 10)})`,
    });

    return successResponse(res, sheet, `Timesheet ${status}`);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ── PUT /api/timesheets/:id  (edit own entry) ──────────────────────────────
const updateTimesheet = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const sheet = await Timesheet.findOne({ _id: req.params.id, organizationId });
    if (!sheet) return errorResponse(res, 'Timesheet not found', 404);

    const canReview = isElevatedRole(req.user);

    const { hours, billingType, notes, status, date } = req.body;

    if (status && ['approved', 'rejected'].includes(status)) {
      if (!canReview) return errorResponse(res, 'Unauthorized to approve/reject timesheets', 403);
      sheet.status     = status;
      sheet.reviewedBy = req.user._id;
      sheet.reviewedAt = new Date();
      if (req.io) {
        req.io.to(`org:${organizationId}`).emit('timesheet:updated', {
          id: sheet._id, status, userId: sheet.userId,
        });
      }
    } else {
      if (req.user.userId !== sheet.userId.toString() && !canReview) {
        return errorResponse(res, 'Unauthorized to update this timesheet', 403);
      }
      if (hours       !== undefined) sheet.hours       = hours;
      if (billingType)               sheet.billingType = billingType;
      if (notes       !== undefined) sheet.notes       = notes;
      if (date)                      sheet.date        = new Date(date);
    }

    await sheet.save();
    return successResponse(res, sheet, 'Timesheet updated');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ── DELETE /api/timesheets/:id ────────────────────────────────────────────────
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

module.exports = { getTimesheets, createTimesheet, updateTimesheet, approveTimesheet, deleteTimesheet };

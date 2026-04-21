'use strict';
const Task       = require('../models/Task');
const Attendance = require('../models/Attendance');
const Leave      = require('../models/Leave');
const { successResponse, errorResponse } = require('../utils/helpers');

// GET /api/calendar?date=YYYY-MM-DD
exports.getDayData = async (req, res) => {
  try {
    const { userId, role, organizationId } = req.user;

    console.log(`[CALENDAR] User: ${userId}, Role: ${role}, Org: ${organizationId}`);

    const dateParam = req.query.date;
    if (!dateParam) {
      return errorResponse(res, 'date query parameter is required (YYYY-MM-DD)', 400);
    }

    const dayStart = new Date(dateParam);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(dateParam);
    dayEnd.setHours(23, 59, 59, 999);

    if (isNaN(dayStart.getTime())) {
      return errorResponse(res, 'Invalid date format. Use YYYY-MM-DD', 400);
    }

    const isPrivileged = ['admin', 'hr'].includes(role);

    // ── Task filter ───────────────────────────────────────────────────────────
    let taskFilter = { ...req.orgFilter, dueDate: { $gte: dayStart, $lte: dayEnd } };
    if (role === 'employee') {
      taskFilter.assignedTo = userId;
    } else if (role === 'project_manager' || role === 'manager') {
      taskFilter.$or = [{ assignedTo: userId }, { createdBy: userId }];
    }

    // ── Attendance filter — model uses 'user' field ───────────────────────────
    let attFilter = { organizationId, date: { $gte: dayStart, $lte: dayEnd } };
    if (!isPrivileged) attFilter.user = userId;

    // ── Leave filter — model uses 'user' field ────────────────────────────────
    let leaveFilter = {
      organizationId,
      startDate: { $lte: dayEnd },
      endDate:   { $gte: dayStart },
    };
    if (!isPrivileged) leaveFilter.user = userId;

    const [tasks, attendance, leaves] = await Promise.all([
      Task.find(taskFilter)
        .select('title status priority dueDate assignedTo projectId')
        .populate('assignedTo', 'name email')
        .populate('projectId', 'name projectTitle')
        .lean(),
      Attendance.find(attFilter)
        .populate('user', 'name email')           // Attendance model: 'user' ref
        .lean()
        .catch(() => []),
      Leave.find(leaveFilter)
        .populate('user', 'name email')            // Leave model: 'user' ref
        .lean()
        .catch(() => []),
    ]);

    console.log(
      `[CALENDAR] Date: ${dateParam} → tasks:${tasks.length}, attendance:${attendance.length}, leaves:${leaves.length}`
    );

    // Normalize for frontend — expose 'user' nested object clearly
    const normalizedAttendance = attendance.map(a => ({
      _id:    a._id,
      user:   a.user,           // { name, email }
      date:   a.date,
      status: a.status,
      checkIn:  a.checkIn,
      checkOut: a.checkOut,
      workingHours: a.workingHours,
    }));

    const normalizedLeaves = leaves.map(l => ({
      _id:       l._id,
      user:      l.user,        // { name, email }
      leaveType: l.leaveType,
      startDate: l.startDate,
      endDate:   l.endDate,
      status:    l.status,
    }));

    return successResponse(res, {
      date:       dateParam,
      tasks:      tasks || [],
      attendance: normalizedAttendance,
      leaves:     normalizedLeaves,
    });
  } catch (err) {
    console.error('[CALENDAR ERROR]:', err);
    return errorResponse(res, err.message, 500);
  }
};

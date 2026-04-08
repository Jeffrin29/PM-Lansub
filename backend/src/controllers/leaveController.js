'use strict';
const HrEmployee = require('../models/HrEmployee');
const Leave = require('../models/Leave');
const { logActivity } = require('../services/activityService');
const { sendNotification } = require('../services/notificationService');
const { errorResponse, successResponse } = require('../utils/helpers');

// Helper: find the HR employee record that belongs to the logged-in user
const getMyEmployee = async (req) => {
  const orgId = req.user?.organizationId;
  return HrEmployee.findOne({ organizationId: orgId, userId: req.user._id }).lean();
};

exports.applyLeave = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);

    const { leaveType, startDate, endDate, reason } = req.body;
    if (!leaveType || !startDate || !endDate) {
      return errorResponse(res, 'leaveType, startDate, and endDate are required.', 400);
    }

    const leave = await Leave.create({
      organizationId: orgId,
      employeeId: emp._id,
      user: req.user._id,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || '',
      status: 'Pending',
    });

    console.log("Leaves:", leave); // Debug as requested

    // ✅ LOG ACTIVITY
    await logActivity({
      userId: req.user._id,
      organizationId: orgId,
      action: 'leave:applied',
      entityType: 'leave',
      entityId: leave._id,
      description: `Leave applied: ${leaveType} (${startDate} to ${endDate})`
    });

    // ✅ TRIGGER NOTIFICATION (For HR/Admin)
    // Simplified for demo: notifying the app's current user for visibility
    await sendNotification({
      userId: req.user._id, 
      organizationId: orgId,
      title: 'Leave Request Submitted',
      message: `Your ${leaveType} leave request has been submitted for review.`,
      type: 'system',
      link: { type: 'leave', id: leave._id }
    });

    return successResponse(res, leave, 'Leave application submitted.', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);

    const leaves = await Leave.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    console.log("Leaves History:", leaves); // Debug
    return successResponse(res, leaves, 'Leaves fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};
exports.cancelLeave = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    const leave = await Leave.findOneAndDelete({ _id: req.params.id, organizationId: orgId, user: req.user._id });
    if (!leave) return errorResponse(res, 'Leave not found or unauthorized.', 404);
    return successResponse(res, null, 'Leave request cancelled.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

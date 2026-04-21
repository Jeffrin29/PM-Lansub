'use strict';
const HrEmployee = require('../models/HrEmployee');
const Leave = require('../models/Leave');
const { logActivity } = require('../services/activityService');
const { sendNotification } = require('../services/notificationService');
const { errorResponse, successResponse } = require('../utils/helpers');

// Helper: find or JIT-create the HR employee record for the logged-in user
const getMyEmployee = async (req) => {
  const orgId = req.user?.organizationId;
  const userId = req.user?.userId || req.user?._id?.toString();

  if (!userId || !orgId) {
    console.error('[leaveController] Missing userId or orgId:', req.user);
    return null;
  }

  let emp = await HrEmployee.findOne({ organizationId: orgId, userId }).lean();

  if (!emp) {
    console.warn(`[leaveController] No employee record for user ${userId}. Creating JIT record...`);
    try {
      const created = await HrEmployee.create({
        organizationId: orgId,
        userId,
        name: req.user.name || 'Employee',
        email: req.user.email || 'unknown@domain.com',
        role: req.user.role || 'employee',
        status: 'active',
        department: 'General',
      });
      emp = created.toObject ? created.toObject() : created;
      console.log(`[leaveController] JIT employee created: ${emp._id}`);
    } catch (jitErr) {
      console.error('[leaveController] JIT employee creation failed:', jitErr.message);
      return null;
    }
  }

  return emp;
};

exports.applyLeave = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    const userId = req.user?.userId || req.user?._id;
    const emp = await getMyEmployee(req);

    const { leaveType, startDate, endDate, reason } = req.body;
    if (!leaveType || !startDate || !endDate) {
      return errorResponse(res, 'leaveType, startDate, and endDate are required.', 400);
    }

    const leave = await Leave.create({
      organizationId: orgId,
      employeeId: emp._id,
      user: userId,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || '',
      status: 'Pending',
    });

    console.log("Leaves:", leave);

    // ✅ LOG ACTIVITY
    await logActivity({
      userId,
      organizationId: orgId,
      action: 'leave:applied',
      entityType: 'leave',
      entityId: leave._id,
      description: `Leave applied: ${leaveType} (${startDate} to ${endDate})`
    });

    // ✅ TRIGGER NOTIFICATION
    await sendNotification({
      userId,
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
    const orgId = req.user?.organizationId;
    const userId = req.user?.userId || req.user?._id?.toString();

    console.log(`[leaveController] getMyLeaves - userId: ${userId}, orgId: ${orgId}`);

    // JIT create employee if needed (background, don't block response)
    getMyEmployee(req).catch(err => console.warn('[leaveController] JIT emp warn:', err.message));

    // Fetch leaves by userId directly
    const leaves = await Leave.find({ organizationId: orgId, user: userId })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`[leaveController] Found ${leaves.length} leaves for user ${userId}`);
    return successResponse(res, leaves || [], 'Leaves fetched.');
  } catch (err) {
    console.error('[leaveController] getMyLeaves error:', err);
    return errorResponse(res, err.message, 500);
  }
};
exports.cancelLeave = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    const userId = req.user?.userId || req.user?._id;
    const leave = await Leave.findOneAndDelete({ _id: req.params.id, organizationId: orgId, user: userId });
    if (!leave) return errorResponse(res, 'Leave not found or unauthorized.', 404);
    return successResponse(res, null, 'Leave request cancelled.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

'use strict';
const Meeting = require('../models/Meeting');
const Notification = require('../models/Notification');
const { createAuditLog } = require('../utils/auditLog');
const { successResponse, errorResponse } = require('../utils/helpers');

// ── GET /api/meetings ─────────────────────────────────────────────────────────
exports.getMeetings = async (req, res) => {
  try {
    const orgId = req.user.organizationId;

    const meetings = await Meeting.find({ organizationId: orgId })
      .populate('createdBy', 'name email')
      .populate('participants', 'name email')
      .sort({ date: -1 })
      .lean();

    return successResponse(res, meetings, 'Meetings fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ── POST /api/meetings ────────────────────────────────────────────────────────
exports.createMeeting = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { title, description, date, time, meetingLink, participants } = req.body;

    if (!title || !date || !time) {
      return errorResponse(res, 'title, date and time are required.', 400);
    }

    const meeting = await Meeting.create({
      title,
      description: description || '',
      date: new Date(date),
      time,
      meetingLink: meetingLink || null,
      organizationId: orgId,
      createdBy: req.user._id,
      participants: participants || [],
    });

    const populated = await meeting.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'participants', select: 'name email' },
    ]);

    // ── Notify each participant ──────────────────────────────────────────────
    if (participants && participants.length > 0) {
      const notifDocs = participants
        .filter((id) => id.toString() !== req.user._id.toString())
        .map((userId) => ({
          userId,
          organizationId: orgId,
          title: 'Meeting Scheduled',
          message: `You have been invited to "${title}" on ${new Date(date).toLocaleDateString()} at ${time}`,
          type: 'system',
          priority: 'normal',
        }));
      if (notifDocs.length > 0) {
        await Notification.insertMany(notifDocs);
      }
    }

    // ── Audit log ────────────────────────────────────────────────────────────
    createAuditLog({
      userId: req.user._id,
      organizationId: orgId,
      action: 'CREATE_MEETING',
      entityType: 'meeting',
      entityId: meeting._id,
      description: `Meeting scheduled: "${title}" on ${date} at ${time}`,
    });

    return successResponse(res, populated, 'Meeting scheduled.', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

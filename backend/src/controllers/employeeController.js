'use strict';

const HrEmployee = require('../models/HrEmployee');
const HrAttendance = require('../models/HrAttendance');
const Leave = require('../models/Leave');
const { errorResponse, successResponse } = require('../utils/helpers');

// Helper: find the HR employee record that belongs to the logged-in user
const getMyEmployee = async (req) => {
  const orgId = req.user?.organizationId;
  return HrEmployee.findOne({ organizationId: orgId, userId: req.user._id }).lean();
};

// ─── My Profile ───────────────────────────────────────────────────────────────

exports.getMyProfile = async (req, res) => {
  try {
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);
    return successResponse(res, 'Profile fetched.', emp);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── My Attendance ────────────────────────────────────────────────────────────

exports.getMyAttendance = async (req, res) => {
  try {
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);

    const { month } = req.query; // optional "2026-03"
    const filter = { employeeId: emp._id };
    if (month) filter.date = { $regex: `^${month}` };

    const records = await HrAttendance.find(filter).sort({ date: -1 }).limit(100).lean();
    return successResponse(res, 'Attendance fetched.', records);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.checkIn = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);

    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    let record = await HrAttendance.findOne({ employeeId: emp._id, date: today });
    if (record) {
      if (record.checkIn) return errorResponse(res, 'Already checked in today.', 400);
      record.checkIn = new Date();
      record.status = 'present';
      await record.save();
    } else {
      record = await HrAttendance.create({
        organizationId: orgId,
        employeeId: emp._id,
        userId: req.user._id,
        date: today,
        checkIn: new Date(),
        status: 'present',
      });
    }
    return successResponse(res, 'Checked in successfully.', record);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.checkOut = async (req, res) => {
  try {
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);

    const today = new Date().toISOString().split('T')[0];
    const record = await HrAttendance.findOne({ employeeId: emp._id, date: today });
    if (!record || !record.checkIn) return errorResponse(res, 'No check-in found for today.', 400);
    if (record.checkOut) return errorResponse(res, 'Already checked out today.', 400);

    record.checkOut = new Date();
    await record.save();
    return successResponse(res, 'Checked out successfully.', record);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── My Leaves ────────────────────────────────────────────────────────────────

exports.getMyLeaves = async (req, res) => {
  try {
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);

    const leaves = await Leave.find({ employeeId: emp._id }).sort({ createdAt: -1 }).lean();
    return successResponse(res, 'Leaves fetched.', leaves);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
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
      userId: req.user._id,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || '',
      approvalStatus: 'Pending',
    });
    return successResponse(res, 'Leave application submitted.', leave, 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── My Stats (dashboard cards) ───────────────────────────────────────────────

exports.getMyStats = async (req, res) => {
  try {
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);

    const now = new Date();
    const monthStr = now.toISOString().slice(0, 7); // "YYYY-MM"

    // Attendance this month
    const monthAttendance = await HrAttendance.find({
      employeeId: emp._id,
      date: { $regex: `^${monthStr}` },
    }).lean();

    const presentDays = monthAttendance.filter((a) => a.status === 'present' || a.checkIn).length;

    // Get working days in month (approx days so far)
    const dayOfMonth = now.getDate();
    const attendancePct = dayOfMonth > 0 ? Math.round((presentDays / dayOfMonth) * 100) : 0;

    // Leaves this month
    const monthLeaves = await Leave.find({
      employeeId: emp._id,
      startDate: { $gte: new Date(`${monthStr}-01`) },
    }).lean();

    const pendingLeaves = await Leave.countDocuments({ employeeId: emp._id, approvalStatus: 'Pending' });

    return successResponse(res, 'Stats fetched.', {
      totalLeavesThisMonth: monthLeaves.length,
      pendingLeaves,
      attendanceThisWeekPct: attendancePct,
      presentDays,
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── Monthly Attendance Chart ──────────────────────────────────────────────────

exports.getMonthlyAttendanceChart = async (req, res) => {
  try {
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);

    // Last 6 months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7));
    }

    const data = await Promise.all(
      months.map(async (m) => {
        const records = await HrAttendance.find({
          employeeId: emp._id,
          date: { $regex: `^${m}` },
        }).lean();
        const present = records.filter((r) => r.checkIn).length;
        // Days in that month
        const [y, mo] = m.split('-').map(Number);
        const daysInMonth = new Date(y, mo, 0).getDate();
        return {
          month: m,
          presentDays: present,
          percentage: daysInMonth > 0 ? Math.round((present / daysInMonth) * 100) : 0,
        };
      })
    );

    return successResponse(res, 'Monthly chart data fetched.', data);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

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
    if (month) {
      const [year, m] = month.split('-').map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 1);
      filter.date = { $gte: start, $lt: end };
    }

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

    const { leaveType, type, startDate, endDate, reason } = req.body;
    const finalType = leaveType || type;
    if (!finalType || !startDate || !endDate) {
      return errorResponse(res, 'type, startDate, and endDate are required.', 400);
    }

    const leave = await Leave.create({
      organizationId: orgId,
      employeeId: emp._id,
      userId: req.user._id,
      leaveType: finalType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || '',
      status: 'pending',
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
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    console.log("Start:", start);
    console.log("End:", end);

    // 1. Get Present Days this month
    const monthAttendance = await HrAttendance.find({
      employeeId: emp._id,
      date: { $gte: start, $lt: end },
      checkIn: { $exists: true, $ne: null }
    }).lean();

    const presentDays = monthAttendance.length;

    // 2. Calculate Working Days (Total days so far this month - Holidays)
    let workingDays = 0;
    let holidays = 0;
    const todayDate = now.getDate();

    for (let d = 1; d <= todayDate; d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

      let isHoliday = false;
      if (dayOfWeek === 0) {
        isHoliday = true; // Sunday
      } else if (dayOfWeek === 6) {
        // Saturday logic: 2nd and 4th
        const weekNum = Math.ceil(d / 7);
        if (weekNum === 2 || weekNum === 4) {
          isHoliday = true;
        }
      }

      if (isHoliday) {
        holidays++;
      } else {
        workingDays++;
      }
    }

    const attendancePercentage = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

    // 3. Leaves this month
    const monthlyLeaves = await Leave.countDocuments({
      employeeId: emp._id,
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ],
      status: 'approved'
    });

    const pendingRequests = await Leave.countDocuments({
      employeeId: emp._id,
      status: 'pending'
    });

    return successResponse(res, 'Stats fetched.', {
      presentDays,
      workingDays,
      attendancePercentage,
      monthlyLeaves,
      pendingRequests
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

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Get all days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const chartData = [];

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    const records = await HrAttendance.find({
      employeeId: emp._id,
      date: { $gte: start, $lt: end }
    }).lean();

    const recordMap = new Map(records.map(r => [new Date(r.date).toISOString().split('T')[0], r]));

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(year, month, d);
      const dayOfWeek = dateObj.getDay();

      let status = 'absent';
      const record = recordMap.get(dateStr);

      if (dayOfWeek === 0) {
        status = 'holiday';
      } else if (dayOfWeek === 6) {
        const weekNum = Math.ceil(d / 7);
        if (weekNum === 2 || weekNum === 4) {
          status = 'holiday';
        }
      }

      if (record && record.checkIn) {
        status = 'present';
      }

      // If it's a holiday but they checked in, mark as present? Usually yes.
      if (record && record.checkIn) status = 'present';

      // If it's today and they haven't checked in yet, maybe don't mark as absent yet?
      // But the requirement says "present" | "absent" | "holiday"

      chartData.push({ date: dateStr, status });
    }

    return successResponse(res, 'Monthly chart data fetched.', chartData);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

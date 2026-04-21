'use strict';

const HrEmployee = require('../models/HrEmployee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { errorResponse, successResponse } = require('../utils/helpers');

// Helper: find the HR employee record that belongs to the logged-in user
const getMyEmployee = async (req) => {
  const orgId = req.user?.organizationId;
  const userId = req.user?.userId || req.user?.id;
  
  if (!userId || !orgId) {
    console.error("[DEBUG] Missing userId or orgId in session", req.user);
    return null;
  }

  console.log(`[DEBUG] Analyzing Employee context for User: ${userId} in Org: ${orgId}`);
  let emp = await HrEmployee.findOne({ organizationId: orgId, userId }).lean();
  
  if (!emp) {
    console.warn(`[WARN] No HR Employee found for user ${userId}. Implementing JIT creation fallback...`);
    try {
      // JIT Creation Fallback
      const newEmp = await HrEmployee.create({
        organizationId: orgId,
        userId: userId,
        name: req.user.name || "Employee",
        email: req.user.email || "unknown@domain.com",
        role: req.user.role || "employee",
        status: "active",
        department: "General"
      });
      console.log(`[DEBUG] JIT Employee identity created: ${newEmp._id}`);
      return newEmp.toObject ? newEmp.toObject() : newEmp;
    } catch (err) {
      console.error("[ERROR] JIT Employee fallback failed:", err.message);
      return null;
    }
  }
  return emp;
};

// ─── My Profile ───────────────────────────────────────────────────────────────

exports.getMyProfile = async (req, res) => {
  try {
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);
    console.log("[DEBUG] Profile found:", emp.name);
    return successResponse(res, emp, 'Profile fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── My Attendance ────────────────────────────────────────────────────────────

exports.getMyAttendance = async (req, res) => {
  try {
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);

    const { month } = req.query; 
    const filter = { 
      $or: [{ user: req.user.userId }, { employeeId: emp._id }],
      organizationId: req.user.organizationId 
    };
    const records = await Attendance.find(filter).sort({ date: -1 }).limit(100).lean();
    console.log(`[DEBUG] Fetched ${records.length} attendance records for ${req.user.userId}`);
    return successResponse(res, records, 'Attendance fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.checkIn = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let record = await Attendance.findOne({ 
      user: userId, 
      organizationId,
      date: { $gte: today, $lt: tomorrow } 
    });

    if (record) {
      return errorResponse(res, 'Already checked in today.', 400);
    }

    const now = new Date();
    record = await Attendance.create({
      organizationId,
      user: userId,
      employeeId: emp._id,
      date: now,
      checkIn: now,
      status: 'Present',
    });

    console.log(`[DEBUG] Check-in successful for user ${userId}`);
    return successResponse(res, record, 'Checked in successfully.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.checkOut = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const record = await Attendance.findOne({ 
      user: userId, 
      organizationId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!record || !record.checkIn) return errorResponse(res, 'No check-in found for today.', 400);
    if (record.checkOut) return errorResponse(res, 'Already checked out today.', 400);

    const now = new Date();
    record.checkOut = now;
    
    // Calculate working hours
    const diffMs = now - record.checkIn;
    record.workingHours = diffMs / (1000 * 60 * 60);

    await record.save();
    console.log(`[DEBUG] Check-out successful for user ${userId}`);
    return successResponse(res, record, 'Checked out successfully.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── My Leaves ────────────────────────────────────────────────────────────────

exports.getMyLeaves = async (req, res) => {
  try {
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);

    const leaves = await Leave.find({ 
      user: req.user.userId,
      organizationId: req.user.organizationId 
    }).sort({ createdAt: -1 }).lean();

    return successResponse(res, leaves, 'Leaves fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.applyLeave = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);

    const { leaveType, type, startDate, endDate, reason } = req.body;
    const finalType = leaveType || type;
    if (!finalType || !startDate || !endDate) {
      return errorResponse(res, 'Type, startDate, and endDate are required.', 400);
    }

    const leave = await Leave.create({
      organizationId,
      user: userId,
      employeeId: emp._id,
      leaveType: finalType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || '',
      status: 'Pending',
    });
    return successResponse(res, leave, 'Leave application submitted.', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── My Stats (dashboard cards) ───────────────────────────────────────────────

exports.getMyStats = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); 
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);

    // 1. Get Present Days this month
    const monthAttendance = await Attendance.find({
      $or: [{ user: userId }, { employeeId: emp._id }],
      organizationId,
      date: { $gte: start, $lt: end },
      checkIn: { $exists: true, $ne: null }
    }).lean();

    const presentDays = monthAttendance.length;

    // 2. Calculate Working Days
    let workingDays = 0;
    const todayDate = now.getDate();

    for (let d = 1; d <= todayDate; d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay(); 
      let isHoliday = (dayOfWeek === 0); // Sunday
      if (dayOfWeek === 6) {
        const weekNum = Math.ceil(d / 7);
        if (weekNum === 2 || weekNum === 4) isHoliday = true;
      }
      if (!isHoliday) workingDays++;
    }

    const attendancePercentage = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

    // 3. Leaves this month
    const monthlyLeaves = await Leave.countDocuments({
      user: userId,
      organizationId,
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
      status: 'Approved'
    });

    const pendingRequests = await Leave.countDocuments({
      user: userId,
      organizationId,
      status: 'Pending'
    });

    const stats = {
      presentDays,
      workingDays,
      attendancePercentage,
      monthlyLeaves,
      pendingRequests
    };

    console.log("[DEBUG] Stats calculated:", stats);
    return successResponse(res, stats, 'Stats fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── Monthly Attendance Chart ──────────────────────────────────────────────────

exports.getMonthlyAttendanceChart = async (req, res) => {
  try {
    const { organizationId, userId } = req.user;
    const emp = await getMyEmployee(req);
    if (!emp) return errorResponse(res, 'Employee record not found.', 404);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const chartData = [];

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    const records = await Attendance.find({
      $or: [{ user: userId }, { employeeId: emp._id }],
      organizationId,
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
        if (weekNum === 2 || weekNum === 4) status = 'holiday';
      }

      if (record && record.checkIn) {
        status = (record.status || 'present').toLowerCase();
      }

      chartData.push({ date: dateStr, status });
    }

    return successResponse(res, chartData, 'Monthly chart data fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

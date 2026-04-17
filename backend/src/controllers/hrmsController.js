'use strict';

const HrEmployee = require('../models/HrEmployee');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../services/activityService');
const { sendNotification } = require('../services/notificationService');
const { errorResponse, successResponse } = require('../utils/helpers');
const { enforceAutoLogout } = require('../utils/attendanceHelper');

// ─── HRMS Stats ───────────────────────────────────────────────────────────────

exports.getHrmsStats = async (req, res) => {
  try {
    const [totalEmp, activeEmp, deptCount, pendingLeaves] = await Promise.all([
      HrEmployee.countDocuments({ ...req.orgFilter }),
      HrEmployee.countDocuments({ ...req.orgFilter, status: 'active' }),
      Department.countDocuments({ ...req.orgFilter }),
      Leave.countDocuments({ ...req.orgFilter, status: 'Pending' }),
    ]);
    
    const stats = {
      totalEmployees: totalEmp,
      activeEmployees: activeEmp,
      departmentsCount: deptCount,
      pendingLeaves,
    };
    
    console.log("[HRMS] Stats fetched:", stats);
    return successResponse(res, stats, 'HRMS stats fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── Employees ────────────────────────────────────────────────────────────────

exports.getEmployees = async (req, res) => {
  try {
    const { search, status, department } = req.query;
    const filter = { ...req.orgFilter };
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const employees = await HrEmployee.find(filter).sort({ createdAt: -1 }).lean();
    console.log(`[HRMS] Fetched ${employees.length} employees`);
    return successResponse(res, employees, 'Employees fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const { organizationId, userId: adminId } = req.user;
    
    if (!name || !email) return errorResponse(res, 'Name and email are required.', 400);

    const exists = await User.findOne({ email });
    if (exists) return errorResponse(res, 'User with this email already exists', 409);

    // Find or Create the correct roleId from DB
    const roleName = (role || 'employee').toLowerCase();
    let dbRole = await Role.findOne({ name: roleName, organizationId });
    if (!dbRole) {
        // Fallback or create default role
        dbRole = await Role.findOne({ name: 'employee', organizationId });
        if (!dbRole) {
            dbRole = await Role.create({
                name: 'employee',
                displayName: 'Employee',
                organizationId,
                permissions: [],
                isSystemRole: true,
                level: 10
            });
        }
    }

    // 1. Create User
    const tempPassword = 'User@123'; // Default password for new members
    const newUser = await User.create({
      name,
      email,
      passwordHash: tempPassword, // Hashed in pre-save hook
      organizationId,
      roleId: dbRole._id,
      role: dbRole.name,
      status: 'active',
    });

    // 2. Create Employee record
    const employee = await HrEmployee.create({
      organizationId,
      userId: newUser._id, 
      name,
      email,
      role: dbRole.name,
      status: 'active',
      department: 'General',
      joiningDate: new Date()
    });

    await logActivity({
      userId: adminId,
      organizationId,
      action: 'employee:added',
      entityType: 'user',
      entityId: newUser._id,
      description: `New employee added: ${name} (${email})`
    });

    return successResponse(res, { employee, userId: newUser._id }, 'Employee successfully created.', 201);
  } catch (err) {
    console.error("[HRMS] createEmployee Error:", err);
    return errorResponse(res, err.message, 500);
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const employee = await HrEmployee.findOneAndUpdate(
      { _id: req.params.id, ...req.orgFilter },
      req.body,
      { new: true, runValidators: true }
    );
    if (!employee) return errorResponse(res, 'Employee not found.', 404);
    return successResponse(res, employee, 'Employee updated.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await HrEmployee.findOneAndDelete({ _id: req.params.id, ...req.orgFilter });
    if (!employee) return errorResponse(res, 'Employee not found.', 404);
    return successResponse(res, 'Employee deleted.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── Departments ──────────────────────────────────────────────────────────────

exports.getDepartments = async (req, res) => {
  try {
    const depts = await Department.find({ ...req.orgFilter }).sort({ name: 1 }).lean();
    return successResponse(res, depts, 'Departments fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return errorResponse(res, 'Department name is required.', 400);
    const dept = await Department.create({ 
      organizationId: req.user.organizationId, 
      name, 
      description: description || '' 
    });
    return successResponse(res, dept, 'Department created.', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findOneAndUpdate(
      { _id: req.params.id, ...req.orgFilter },
      req.body,
      { new: true }
    );
    if (!dept) return errorResponse(res, 'Department not found.', 404);
    return successResponse(res, dept, 'Department updated.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findOneAndDelete({ _id: req.params.id, ...req.orgFilter });
    if (!dept) return errorResponse(res, 'Department not found.', 404);
    return successResponse(res, 'Department deleted.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── Attendance (Admin/HR view) ───────────────────────────────────────────────────

exports.getAttendance = async (req, res) => {
  try {
    const { date, employeeId, month } = req.query;
    const filter = { ...req.orgFilter };
    
    if (date) {
      const d = new Date(date);
      d.setHours(0,0,0,0);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);
      filter.date = { $gte: d, $lt: nextD };
    }

    if (employeeId) {
      // Check if employeeId is an HrEmployee ID or a User ID
      const empRecord = await HrEmployee.findById(employeeId).lean();
      filter.user = empRecord ? empRecord.userId : employeeId;
    }

    if (month) {
      const [year, m] = month.split('-').map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 1);
      filter.date = { $gte: start, $lt: end };
    }

    console.log("[HRMS] Attendance query filter:", filter);
    const records = await Attendance.find(filter)
      .populate('user', 'name email')
      .sort({ date: -1 })
      .lean();

    const processedRecords = records.map(r => enforceAutoLogout(r));
    return successResponse(res, processedRecords, 'Attendance fetched.');
  } catch (err) {
    console.error("[HRMS] getAttendance Error:", err);
    return errorResponse(res, err.message, 500);
  }
};

// ─── Leaves (Admin/HR view) ──────────────────────────────────────────────────────

exports.getLeaves = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const filter = { ...req.orgFilter };
    if (status) filter.status = status;
    
    if (employeeId) {
      const empRecord = await HrEmployee.findById(employeeId).lean();
      filter.user = empRecord ? empRecord.userId : employeeId;
    }

    const leaves = await Leave.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return successResponse(res, leaves, 'Leaves fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['Approved', 'Rejected', 'Pending'].includes(status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase())) {
        return errorResponse(res, 'Invalid status.', 400);
    }
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    
    const leave = await Leave.findOneAndUpdate(
      { _id: req.params.id, ...req.orgFilter },
      {
        status: normalizedStatus,
        approvedBy: req.user.userId,
        approvedAt: new Date(),
        rejectionReason: rejectionReason || null,
      },
      { new: true }
    ).populate('user', 'name email');
    
    if (!leave) return errorResponse(res, 'Leave request not found.', 404);

    await logActivity({
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      action: `leave:${normalizedStatus.toLowerCase()}`,
      entityType: 'leave',
      entityId: leave._id,
      description: `Leave ${normalizedStatus} for user: ${leave.user?.name}`
    });

    await sendNotification({
      userId: leave.user?._id || leave.user,
      organizationId: req.user.organizationId,
      title: `Leave ${normalizedStatus}`,
      message: `Your leave request for ${leave.leaveType} has been ${normalizedStatus.toLowerCase()}.`,
      type: normalizedStatus === 'Approved' ? 'leave_approved' : 'leave_rejected',
      link: { type: 'leave', id: leave._id }
    });

    return successResponse(res, leave, `Leave ${normalizedStatus}.`);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.approveLeave = async (req, res) => {
    req.body.status = 'Approved';
    return exports.updateLeaveStatus(req, res);
};

exports.rejectLeave = async (req, res) => {
    req.body.status = 'Rejected';
    return exports.updateLeaveStatus(req, res);
};

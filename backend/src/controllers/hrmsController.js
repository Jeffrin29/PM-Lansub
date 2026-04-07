'use strict';

const HrEmployee = require('../models/HrEmployee');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { errorResponse, successResponse } = require('../utils/helpers');
const { enforceAutoLogout } = require('../utils/attendanceHelper');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getOrgId = (req) => req.user?.organizationId;

// ─── HRMS Stats ───────────────────────────────────────────────────────────────

exports.getHrmsStats = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const [totalEmp, activeEmp, deptCount, pendingLeaves] = await Promise.all([
      HrEmployee.countDocuments({ organizationId: orgId }),
      HrEmployee.countDocuments({ organizationId: orgId, status: 'active' }),
      Department.countDocuments({ organizationId: orgId }),
      Leave.countDocuments({ organizationId: orgId, status: 'pending' }),
    ]);
    return successResponse(res, {
      totalEmployees: totalEmp,
      activeEmployees: activeEmp,
      departmentsCount: deptCount,
      pendingLeaves,
    }, 'HRMS stats fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── Employees ────────────────────────────────────────────────────────────────

exports.getEmployees = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { search, status, department } = req.query;
    const filter = { organizationId: orgId };
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const employees = await HrEmployee.find(filter).sort({ createdAt: -1 }).lean();
    return successResponse(res, employees, 'Employees fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.createEmployee = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { name, email, password, role, department, status, joiningDate, phone } = req.body;
    
    if (!name || !email) return errorResponse(res, 'Name and email are required.', 400);

    const exists = await User.findOne({ email });
    if (exists) return errorResponse(res, 'User with this email already exists', 409);

    // 1. Create User
    const hash = await bcrypt.hash(password || 'TempPass@123', 10);
    const user = await User.create({
      name,
      email,
      passwordHash: hash,
      organizationId: orgId,
      role: role?.toLowerCase() || 'employee',
      status: 'active',
    });

    // 2. Create Employee
    const employee = await HrEmployee.create({
      organizationId: orgId,
      userId: user._id, 
      name,
      email,
      role: role || 'Employee',
      department: department || null,
      status: status || 'active',
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      phone: phone || null,
    });

    return successResponse(res, { employee, userId: user._id }, 'Employee and User created.', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const employee = await HrEmployee.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId },
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
    const orgId = getOrgId(req);
    const employee = await HrEmployee.findOneAndDelete({ _id: req.params.id, organizationId: orgId });
    if (!employee) return errorResponse(res, 'Employee not found.', 404);
    return successResponse(res, 'Employee deleted.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── Departments ──────────────────────────────────────────────────────────────

exports.getDepartments = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const depts = await Department.find({ organizationId: orgId }).sort({ name: 1 }).lean();
    return successResponse(res, depts, 'Departments fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { name, description } = req.body;
    if (!name) return errorResponse(res, 'Department name is required.', 400);
    const dept = await Department.create({ organizationId: orgId, name, description: description || '' });
    return successResponse(res, dept, 'Department created.', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const dept = await Department.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId },
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
    const orgId = getOrgId(req);
    const dept = await Department.findOneAndDelete({ _id: req.params.id, organizationId: orgId });
    if (!dept) return errorResponse(res, 'Department not found.', 404);
    return successResponse(res, 'Department deleted.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── Attendance (Admin view) ───────────────────────────────────────────────────

exports.getAttendance = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { date, employeeId, month } = req.query;
    const filter = { organizationId: orgId };
    if (date) filter.date = date;
    if (employeeId) filter.user = employeeId;
    if (month) {
      // month = "2026-03"
      const [year, m] = month.split('-').map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 1);
      console.log("Start:", start);
      console.log("End:", end);
      filter.date = { $gte: start, $lt: end };
    }
    const records = await Attendance.find(filter)
      .populate('user', 'name email role')
      .sort({ date: -1 });

    // Apply auto-logout logic to all records
    const processedRecords = await Promise.all(records.map(r => enforceAutoLogout(r)));
    
    return successResponse(res, processedRecords, 'Attendance fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── Leaves (Admin view) ──────────────────────────────────────────────────────

exports.getLeaves = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { status, employeeId } = req.query;
    const filter = { organizationId: orgId };
    if (status) filter.status = status;
    if (employeeId) filter.user = employeeId; // Using user ref from Leave model
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
    const orgId = getOrgId(req);
    const { status, rejectionReason } = req.body;
    if (!['Approved', 'Rejected', 'approved', 'rejected'].includes(status)) {
      return errorResponse(res, 'status must be Approved or Rejected.', 400);
    }
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const leave = await Leave.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId },
      {
        status: normalizedStatus,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        rejectionReason: rejectionReason || null,
      },
      { new: true }
    ).populate('user', 'name email');
    if (!leave) return errorResponse(res, 'Leave request not found.', 404);
    return successResponse(res, `Leave ${normalizedStatus}.`, leave);
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

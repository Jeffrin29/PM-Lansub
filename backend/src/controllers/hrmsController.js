'use strict';

const HrEmployee   = require('../models/HrEmployee');
const Department   = require('../models/Department');
const HrAttendance = require('../models/HrAttendance');
const Leave        = require('../models/Leave');
const Notification = require('../models/Notification');
const { generateEmployeeId } = require('../utils/employeeIdHelper');
const { createAuditLog }     = require('../utils/auditLog');
const { errorResponse, successResponse } = require('../utils/helpers');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getOrgId = (req) => req.user?.organizationId;

/** Checks if the requesting user has an elevated role (admin / hr / project_manager) */
const isPrivilegedRole = (req) => {
  const roleName = (req.user?.role?.name || '').toLowerCase();
  const roleDisplay = (req.user?.role?.displayName || '').toLowerCase();
  const privileged = ['admin', 'org_admin', 'hr', 'manager', 'project_manager', 'project manager'];
  return privileged.some((r) => roleName.includes(r) || roleDisplay.includes(r));
};

// ─── HRMS Stats ───────────────────────────────────────────────────────────────

exports.getHrmsStats = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const [totalEmp, activeEmp, deptCount, pendingLeaves] = await Promise.all([
      HrEmployee.countDocuments({ organizationId: orgId }),
      HrEmployee.countDocuments({ organizationId: orgId, status: 'active' }),
      Department.countDocuments({ organizationId: orgId }),
      Leave.countDocuments({ organizationId: orgId, approvalStatus: 'Pending' }),
    ]);
    return successResponse(res, {
      totalEmployees: totalEmp,
      activeEmployees: activeEmp,
      departments: deptCount,
      pendingLeaves,
    }, 'HRMS stats fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ─── Employees ────────────────────────────────────────────────────────────────

/**
 * getAllEmployees — Admin / HR / PM only.
 * Returns all employees in the org, with User (name, email, role) and Department populated.
 * Supports ?search=, ?status=, ?department=, ?employmentType=
 */
exports.getAllEmployees = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { search, status, department, employmentType } = req.query;
    const filter = { organizationId: orgId };
    if (status)         filter.status = status;
    if (employmentType) filter.employmentType = employmentType;
    if (department)     filter.departmentId = department;
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await HrEmployee
      .find(filter)
      .populate('userId',       'name email status roleId')
      .populate({ path: 'userId', populate: { path: 'roleId', select: 'name displayName level' } })
      .populate('departmentId', 'name')
      .populate('managerId',    'name email')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, employees, 'Employees fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

/**
 * getEmployees — legacy endpoint kept for backward compat (admin/hr routes).
 */
exports.getEmployees = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { search, status, department } = req.query;
    const filter = { organizationId: orgId };
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const employees = await HrEmployee
      .find(filter)
      .populate('userId', 'name email status')
      .populate('departmentId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    return successResponse(res, employees, 'Employees fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

/**
 * getMyProfile — any authenticated user can view their own HrEmployee record.
 * Populates linked User, Role, Department, and Manager.
 */
exports.getMyProfile = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const emp = await HrEmployee
      .findOne({ organizationId: orgId, userId: req.user._id })
      .populate('userId',       'name email status phone timezone lastLogin')
      .populate({ path: 'userId', populate: { path: 'roleId', select: 'name displayName level' } })
      .populate('departmentId', 'name description')
      .populate('managerId',    'name email')
      .lean();

    if (!emp) return errorResponse(res, 'Employee profile not found.', 404);
    return successResponse(res, emp, 'Profile fetched.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { name, email, designation, department, departmentId, status, joiningDate, phone, employmentType, workLocation } = req.body;
    if (!name || !email) return errorResponse(res, 'Name and email are required.', 400);

    // Block creating a duplicate HrEmployee for an existing userId
    if (req.body.userId) {
      const exists = await HrEmployee.findOne({ userId: req.body.userId, organizationId: orgId });
      if (exists) return errorResponse(res, 'An employee record already exists for this user.', 409);
    }

    // Auto-generate employeeId using shared numeric-safe utility
    const employeeId = await generateEmployeeId(orgId);

    const employee = await HrEmployee.create({
      organizationId: orgId,
      userId:         req.body.userId || undefined,
      employeeId,
      name,
      email,
      designation:    designation || 'Employee',
      departmentId:   departmentId || null,
      department:     department   || null,
      status:         status       || 'active',
      joiningDate:    joiningDate ? new Date(joiningDate) : new Date(),
      phone:          phone        || null,
      employmentType: employmentType || 'full-time',
      workLocation:   workLocation   || null,
    });
    return successResponse(res, employee, 'Employee created.', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const orgId = getOrgId(req);

    // Whitelist of fields that are safe to update — never let callers overwrite userId / organizationId
    const ALLOWED = [
      'name', 'email', 'designation', 'department', 'departmentId',
      'managerId', 'joiningDate', 'employmentType', 'status',
      'workLocation', 'phone', 'emergencyContact',
    ];
    const updates = {};
    for (const field of ALLOWED) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const employee = await HrEmployee.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId },
      updates,
      { new: true, runValidators: true }
    )
      .populate('userId',       'name email status')
      .populate('departmentId', 'name')
      .populate('managerId',    'name email');

    if (!employee) return errorResponse(res, 'Employee not found.', 404);

    createAuditLog({
      userId:         req.user._id,
      organizationId: orgId,
      action:         'EMPLOYEE_UPDATED',
      entityType:     'employee',
      entityId:       employee._id,
      description:    `Employee ${employee.name} (${employee.employeeId}) updated`,
    });

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

    createAuditLog({
      userId:         req.user._id,
      organizationId: orgId,
      action:         'EMPLOYEE_DELETED',
      entityType:     'employee',
      entityId:       req.params.id,
      description:    `Employee ${employee.name} (${employee.employeeId}) deleted`,
    });

    return successResponse(res, null, 'Employee deleted.');
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
    return successResponse(res, null, 'Department deleted.');
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
    if (employeeId) filter.employeeId = employeeId;
    if (month) {
      // month = "2026-03"
      filter.date = { $regex: `^${month}` };
    }
    const records = await HrAttendance.find(filter)
      .populate('employeeId', 'name email department designation employeeId')
      .sort({ date: -1 })
      .limit(200)
      .lean();
    return successResponse(res, records, 'Attendance fetched.');
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
    if (status) filter.approvalStatus = status;
    if (employeeId) filter.employeeId = employeeId;
    const leaves = await Leave.find(filter)
      .populate('employeeId', 'name email department designation employeeId')
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
    const { approvalStatus, rejectionReason } = req.body;
    if (!['Approved', 'Rejected'].includes(approvalStatus)) {
      return errorResponse(res, 'approvalStatus must be Approved or Rejected.', 400);
    }
    const leave = await Leave.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId },
      {
        approvalStatus,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        rejectionReason: rejectionReason || null,
      },
      { new: true }
    ).populate('employeeId', 'name email');
    if (!leave) return errorResponse(res, 'Leave request not found.', 404);

    // ── Notify the applicant ────────────────────────────────────────────────
    if (leave.userId) {
      await Notification.create({
        userId:         leave.userId,
        organizationId: orgId,
        title:   `Leave ${approvalStatus}`,
        message: `Your ${leave.leaveType} request (${new Date(leave.startDate).toLocaleDateString()} – ${new Date(leave.endDate).toLocaleDateString()}) has been ${approvalStatus.toLowerCase()}.`,
        type:    'system',
        priority: approvalStatus === 'Rejected' ? 'high' : 'normal',
      });
    }

    // ── Audit log ──────────────────────────────────────────────────────────
    createAuditLog({
      userId:         req.user._id,
      organizationId: orgId,
      action:         `LEAVE_${approvalStatus.toUpperCase()}`,
      entityType:     'leave',
      entityId:       leave._id,
      description:    `Leave ${approvalStatus} for employee ${leave.employeeId?.name || leave.userId} (${leave.leaveType})`,
    });

    return successResponse(res, leave, `Leave ${approvalStatus.toLowerCase()}.`);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');
const { organizationIsolation } = require('../middleware/organizationIsolation');
const hrms = require('../controllers/hrmsController');

// All HRMS routes require authentication + org isolation + Admin or HR role
router.use(authenticate, organizationIsolation, requireRole(['admin', 'hr', 'manager']));

// ─── Stats ───────────────────────────────────────────────────────────────────
router.get('/stats', hrms.getHrmsStats);
router.get('/dashboard', hrms.getHrmsStats);

// ─── Employees ────────────────────────────────────────────────────────────────
router.get('/employees', hrms.getEmployees);
router.post('/employees', hrms.createEmployee);
router.put('/employees/:id', hrms.updateEmployee);
router.delete('/employees/:id', hrms.deleteEmployee);

// ─── Departments ──────────────────────────────────────────────────────────────
router.get('/departments', hrms.getDepartments);
router.post('/departments', hrms.createDepartment);
router.put('/departments/:id', hrms.updateDepartment);
router.delete('/departments/:id', hrms.deleteDepartment);

// ─── Attendance (admin view) ──────────────────────────────────────────────────
router.get('/attendance', hrms.getAttendance);

// ─── Leaves (admin view) ──────────────────────────────────────────────────────
router.get('/leaves', hrms.getLeaves);
router.patch('/leaves/:id/approve', hrms.approveLeave);
router.patch('/leaves/:id/reject', hrms.rejectLeave);
router.put('/leaves/:id/status', hrms.updateLeaveStatus);

module.exports = router;

'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { checkRole } = require('../middleware/checkRole');
const { organizationIsolation } = require('../middleware/organizationIsolation');
const hrms = require('../controllers/hrmsController');

// All HRMS routes require authentication + org isolation
router.use(authenticate, organizationIsolation);

// ─── Stats ───────────────────────────────────────────────────────────────────
router.get('/stats', checkRole('admin', 'hr', 'manager', 'employee'), hrms.getHrmsStats);
router.get('/dashboard', checkRole('admin', 'hr', 'manager', 'employee'), hrms.getHrmsStats);
router.get('/', checkRole('admin', 'hr', 'manager', 'employee'), hrms.getHrmsStats);

// ─── Employees ────────────────────────────────────────────────────────────────
router.get('/employees', checkRole('admin', 'hr', 'manager', 'employee'), hrms.getEmployees);
router.post('/employees', checkRole('admin', 'hr'), hrms.createEmployee);
router.put('/employees/:id', checkRole('admin', 'hr'), hrms.updateEmployee);
router.delete('/employees/:id', checkRole('admin', 'hr'), hrms.deleteEmployee);

// ─── Departments ──────────────────────────────────────────────────────────────
router.get('/departments', checkRole('admin', 'hr', 'manager', 'employee'), hrms.getDepartments);
router.post('/departments', checkRole('admin', 'hr'), hrms.createDepartment);
router.put('/departments/:id', checkRole('admin', 'hr'), hrms.updateDepartment);
router.delete('/departments/:id', checkRole('admin', 'hr'), hrms.deleteDepartment);

// ─── Attendance (admin view) ──────────────────────────────────────────────────
router.get('/attendance', checkRole('admin', 'hr', 'manager', 'employee'), hrms.getAttendance);

// ─── Leaves (admin view) ──────────────────────────────────────────────────────
router.get('/leaves', checkRole('admin', 'hr', 'manager', 'employee'), hrms.getLeaves);
router.patch('/leaves/:id/approve', checkRole('admin', 'hr', 'manager'), hrms.approveLeave);
router.patch('/leaves/:id/reject', checkRole('admin', 'hr', 'manager'), hrms.rejectLeave);
router.put('/leaves/:id/status', checkRole('admin', 'hr' , 'manager'), hrms.updateLeaveStatus);

module.exports = router;

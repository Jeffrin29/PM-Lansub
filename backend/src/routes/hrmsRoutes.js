'use strict';

const express = require('express');
const router  = express.Router();
const { authenticate }           = require('../middleware/authenticate');
const { requireRole }            = require('../middleware/requireRole');
const { organizationIsolation }  = require('../middleware/organizationIsolation');
const hrms = require('../controllers/hrmsController');

// All HRMS routes require a valid JWT + org context
router.use(authenticate, organizationIsolation);

// ─── Routes accessible to ANY authenticated user ──────────────────────────────
// An employee can view their own HRMS profile and see org-level stats.
router.get('/my-profile', hrms.getMyProfile);
router.get('/stats',      hrms.getHrmsStats);

// ─── Privileged zone — Admin / HR / Manager / Project Manager only ────────────
const privileged = requireRole(['Admin', 'Manager', 'admin', 'manager', 'HR', 'Project Manager', 'org_admin']);
router.use(privileged);

// ─── Employees ────────────────────────────────────────────────────────────────
// getAllEmployees — full profile with User/Role/Department populate
router.get('/employees/all',  hrms.getAllEmployees);
// getEmployees  — legacy/compat endpoint
router.get('/employees',      hrms.getEmployees);
router.post('/employees',     hrms.createEmployee);
router.put('/employees/:id',  hrms.updateEmployee);
router.delete('/employees/:id', hrms.deleteEmployee);

// ─── Departments ──────────────────────────────────────────────────────────────
router.get('/departments',        hrms.getDepartments);
router.post('/departments',       hrms.createDepartment);
router.put('/departments/:id',    hrms.updateDepartment);
router.delete('/departments/:id', hrms.deleteDepartment);

// ─── Attendance (admin view) ──────────────────────────────────────────────────
router.get('/attendance', hrms.getAttendance);

// ─── Leaves (admin view) ──────────────────────────────────────────────────────
router.get('/leaves',              hrms.getLeaves);
router.put('/leaves/:id/status',   hrms.updateLeaveStatus);

module.exports = router;

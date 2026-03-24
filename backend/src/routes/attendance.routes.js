'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');
const { organizationIsolation } = require('../middleware/organizationIsolation');
const hrms = require('../controllers/hrmsController');
const emp = require('../controllers/employeeController');

// Mixed routes for attendance: Self-service + Admin
router.use(authenticate, organizationIsolation);

// POST /api/attendance/check-in (Employee)
router.post('/check-in', emp.checkIn);

// POST /api/attendance/check-out (Employee)
router.post('/check-out', emp.checkOut);

// GET /api/attendance/me (Employee history)
router.get('/me', emp.getMyAttendance);

// GET /api/attendance/chart (Employee monthly)
router.get('/chart', emp.getMonthlyAttendanceChart);

// GET /api/attendance (Admin View) - requires role
router.get('/', requireRole(['Admin', 'Manager']), hrms.getAttendance);

module.exports = router;

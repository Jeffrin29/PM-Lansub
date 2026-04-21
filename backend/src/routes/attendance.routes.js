'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { checkRole } = require('../middleware/checkRole');
const { organizationIsolation } = require('../middleware/organizationIsolation');
const hrms = require('../controllers/hrmsController');
const emp = require('../controllers/employeeController');

// Mixed routes for attendance: Self-service + Admin
router.use(authenticate, organizationIsolation);

const attendance = require('../controllers/attendanceController');

// GET /api/attendance/stats (Stats)
router.get('/stats', attendance.getAttendanceStats);

// GET /api/attendance/chart (Chart)
router.get('/chart', attendance.getMonthlyChart);

// GET /api/attendance/my (History log)
router.get('/my', attendance.getMyAttendance);

// POST /api/attendance/checkin
router.post('/checkin', attendance.checkIn);

// POST /api/attendance/checkout
router.post('/checkout', attendance.checkOut);

// GET /api/attendance/all (Admin View)
router.get('/all', checkRole('admin', 'hr', 'manager'), hrms.getAttendance);

// GET /api/attendance (Backward compatibility)
router.get('/', checkRole('admin', 'hr', 'manager'), hrms.getAttendance);

module.exports = router;

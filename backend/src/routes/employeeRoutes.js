'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');
const emp = require('../controllers/employeeController');

// All employee self-service routes require authentication + org isolation
// No restrictive role check — any logged-in active user can access their own data
router.use(authenticate, organizationIsolation);

// ─── My Profile ───────────────────────────────────────────────────────────────
router.get('/me', emp.getMyProfile);

// ─── Stats (dashboard cards) ─────────────────────────────────────────────────
router.get('/stats', emp.getMyStats);

// ─── Monthly Attendance Chart ─────────────────────────────────────────────────
router.get('/attendance/chart', emp.getMonthlyAttendanceChart);

// ─── My Attendance ────────────────────────────────────────────────────────────
router.get('/attendance', emp.getMyAttendance);
router.post('/attendance/check-in', emp.checkIn);
router.post('/attendance/check-out', emp.checkOut);

// ─── My Leaves ────────────────────────────────────────────────────────────────
router.get('/leaves', emp.getMyLeaves);
router.post('/leaves/apply', emp.applyLeave);

module.exports = router;

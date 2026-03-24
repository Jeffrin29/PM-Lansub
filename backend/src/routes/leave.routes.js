'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');
const { organizationIsolation } = require('../middleware/organizationIsolation');
const hrms = require('../controllers/hrmsController');
const emp = require('../controllers/employeeController');

router.use(authenticate, organizationIsolation);

// POST /api/leaves/apply (Employee)
router.post('/apply', emp.applyLeave);

// GET /api/leaves/me (Employee history)
router.get('/me', emp.getMyLeaves);

// GET /api/leaves (Admin View)
router.get('/', requireRole(['Admin', 'Manager']), hrms.getLeaves);

// PUT /api/leaves/:id/status (Admin approval)
router.put('/:id/status', requireRole(['Admin', 'Manager']), hrms.updateLeaveStatus);

module.exports = router;

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

// PUT /api/leaves/:id/status (Admin approval — kept for backward compat)
router.put('/:id/status',   requireRole(['Admin', 'Manager', 'project_manager', 'org_admin']), hrms.updateLeaveStatus);
// PATCH /api/leaves/:id/status (standard REST alias)
router.patch('/:id/status', requireRole(['Admin', 'Manager', 'project_manager', 'org_admin']), hrms.updateLeaveStatus);

module.exports = router;

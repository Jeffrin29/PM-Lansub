'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');
const { organizationIsolation } = require('../middleware/organizationIsolation');
const hrms = require('../controllers/hrmsController');
const emp = require('../controllers/employeeController');

router.use(authenticate, organizationIsolation);

// GET /api/employees/me (My profile)
router.get('/me', emp.getMyProfile);

// GET /api/employees/stats (My dashboard stats)
router.get('/stats', emp.getMyStats);

// Admin-level employee management (CRUD) - role restricted
router.use('/', requireRole(['Admin', 'Manager']));

router.get('/', hrms.getEmployees);
router.post('/', hrms.createEmployee);
router.put('/:id', hrms.updateEmployee);
router.delete('/:id', hrms.deleteEmployee);

module.exports = router;

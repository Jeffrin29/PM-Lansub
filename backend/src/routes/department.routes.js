'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');
const { organizationIsolation } = require('../middleware/organizationIsolation');
const hrms = require('../controllers/hrmsController');

// All department operations require Admin or Manager rights
router.use(authenticate, organizationIsolation, requireRole(['Admin', 'Manager']));

router.get('/', hrms.getDepartments);
router.post('/', hrms.createDepartment);
router.put('/:id', hrms.updateDepartment);
router.delete('/:id', hrms.deleteDepartment);

module.exports = router;

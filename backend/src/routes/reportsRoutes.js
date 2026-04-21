'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportsController');
const { authenticate } = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');
const { checkRole } = require('../middleware/checkRole');

// Reports: admin and project_manager only
router.use(authenticate, organizationIsolation, checkRole('admin', 'project_manager'));

router.get('/',            ctrl.getReports);
router.get('/projects',    ctrl.getProjectsReport);
router.get('/productivity', ctrl.getProductivityReport);
router.get('/delays',      ctrl.getDelayReport);

module.exports = router;

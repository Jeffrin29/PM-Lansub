'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');

router.use(authenticate, organizationIsolation);

router.get('/summary',          ctrl.getSummary);
router.get('/health',           ctrl.getHealth);
router.get('/task-analytics',   ctrl.getTaskAnalytics);
router.get('/project-progress', ctrl.getProjectProgress);
router.get('/workload',         ctrl.getWorkload);
router.get('/cost-analysis',    ctrl.getCostAnalysis);
router.get('/blocking-analytics', ctrl.getBlockingAnalytics);

module.exports = router;

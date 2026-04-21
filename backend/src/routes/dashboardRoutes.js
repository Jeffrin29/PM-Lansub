'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const overviewController = require('../controllers/overviewController');
const { authenticate } = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');

router.use(authenticate, organizationIsolation);

router.get('/', ctrl.getUnifiedDashboard);
router.get('/overview', overviewController.getOverview);
router.get('/summary',            ctrl.getSummary);
router.get('/health',             ctrl.getHealth);
router.get('/task-analytics',     ctrl.getTaskAnalytics);
router.get('/project-progress',   ctrl.getProjectProgress);
router.get('/workload',           ctrl.getWorkload);
router.get('/cost-analysis',      ctrl.getCostAnalysis);
router.get('/blocking-analytics', ctrl.getBlockingAnalytics);
router.get('/recent-activity',    ctrl.getRecentActivity);

module.exports = router;

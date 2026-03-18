'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportsController');
const { authenticate } = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');

router.use(authenticate, organizationIsolation);

router.get('/projects',     ctrl.getProjectsReport);
router.get('/productivity', ctrl.getProductivityReport);
router.get('/delays',       ctrl.getDelayReport);

module.exports = router;

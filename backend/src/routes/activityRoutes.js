'use strict';
const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');

router.use(authenticate, organizationIsolation);

router.get('/', activityController.getActivities);
router.get('/recent', activityController.getRecentActivities);

module.exports = router;

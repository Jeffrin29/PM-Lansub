'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/activityController');
const dashCtrl = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');

router.use(authenticate, organizationIsolation);

router.get('/',       ctrl.getActivity);
router.post('/',      ctrl.createActivity);
router.get('/recent', dashCtrl.getRecentActivity);

module.exports = router;

'use strict';
const express    = require('express');
const router     = express.Router();
const calendarCtrl = require('../controllers/calendarController');
const { authenticate }          = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');

// All calendar routes require authentication + org isolation
router.use(authenticate, organizationIsolation);

// GET /api/calendar?date=YYYY-MM-DD
router.get('/', calendarCtrl.getDayData);

module.exports = router;

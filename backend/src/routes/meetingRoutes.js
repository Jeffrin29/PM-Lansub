'use strict';
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/meetingController');
const { authenticate }          = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');
const { requireRole }           = require('../middleware/requireRole');

router.use(authenticate, organizationIsolation);

router.get('/',  ctrl.getMeetings);
router.post('/', requireRole(['Admin', 'Manager', 'project_manager', 'org_admin', 'HR', 'hr_manager']), ctrl.createMeeting);

module.exports = router;

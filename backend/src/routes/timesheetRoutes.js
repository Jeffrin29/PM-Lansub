'use strict';
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/timesheetController');
const { authenticate }          = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');

router.use(authenticate, organizationIsolation);

router.get('/',         ctrl.getTimesheets);
router.post('/',        ctrl.createTimesheet);
router.patch('/:id',    ctrl.approveTimesheet);   // approve / reject (admin/PM only)
router.put('/:id',      ctrl.updateTimesheet);     // edit own entry
router.delete('/:id',   ctrl.deleteTimesheet);

module.exports = router;

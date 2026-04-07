'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/timesheetController');
const { authenticate } = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');

router.use(authenticate, organizationIsolation);

router.get('/',    ctrl.getTimesheets);
router.post('/',   ctrl.createTimesheet);
router.put('/:id', ctrl.updateTimesheet);
router.patch('/:id/approve', ctrl.approveTimesheet);
router.patch('/:id/reject', ctrl.rejectTimesheet);
router.delete('/:id', ctrl.deleteTimesheet);

module.exports = router;

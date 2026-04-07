'use strict';
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');
const { organizationIsolation } = require('../middleware/organizationIsolation');
const leaveController = require('../controllers/leaveController');
const hrms = require('../controllers/hrmsController');

router.use(authenticate, organizationIsolation);

// GET /my (Self history)
router.get('/my', leaveController.getMyLeaves);

// POST / (Apply Leave)
router.post('/', leaveController.applyLeave);

// GET / (Admin/HR View All)
router.get('/', requireRole(['admin', 'hr', 'manager']), hrms.getLeaves);

// PUT /:id (Update status)
router.put('/:id', requireRole(['admin', 'hr', 'manager']), hrms.updateLeaveStatus);

// PATCH /:id/approve (Backward compatibility)
router.patch('/:id/approve', requireRole(['admin', 'hr', 'manager']), hrms.approveLeave);

// PATCH /:id/reject (Backward compatibility)
router.patch('/:id/reject', requireRole(['admin', 'hr', 'manager']), hrms.rejectLeave);

// DELETE /:id (Cancel Leave)
router.delete('/:id', leaveController.cancelLeave);

module.exports = router;

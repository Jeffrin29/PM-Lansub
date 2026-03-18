const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');

// All notification routes require authentication + org isolation
router.use(authenticate, organizationIsolation);

// ─── GET /api/notifications — list current user's notifications ───────────────
router.get('/', notificationController.getNotifications);

// ─── PATCH /api/notifications/read-all — mark all as read ────────────────────
router.patch('/read-all', notificationController.markAllAsRead);

// ─── DELETE /api/notifications/read — delete all read notifications ───────────
router.delete('/read', notificationController.deleteAllRead);

// ─── PUT/PATCH /api/notifications/:id/read — mark single notification as read ────
router.patch('/:id/read', notificationController.markAsRead);
router.put('/:id/read',   notificationController.markAsRead);

// ─── DELETE /api/notifications/:id — delete single notification ──────────────
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;

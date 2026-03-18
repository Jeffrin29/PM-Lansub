const express = require('express');
const router = express.Router();

const AuditLog = require('../models/AuditLog');
const { authenticate } = require('../middleware/authenticate');
const { requireOrgAdmin } = require('../middleware/authorize');
const { organizationIsolation } = require('../middleware/organizationIsolation');
const { successResponse, getPagination, paginatedResponse } = require('../utils/helpers');

// All audit routes require authentication + org isolation + admin role
router.use(authenticate, organizationIsolation, requireOrgAdmin);

// ─── GET /api/audit — list audit logs for the org ────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { skip, limit, page, sort } = getPagination(req.query);
    const { action, entityType, userId, status, from, to } = req.query;

    const filter = { organizationId: req.user.organizationId };

    if (action) filter.action = action.toUpperCase();
    if (entityType) filter.entityType = entityType;
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email')
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return successResponse(
      res,
      paginatedResponse(logs, total, page, limit),
      'Audit logs fetched.'
    );
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/audit/:id — get single audit log entry ─────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const log = await AuditLog.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    })
      .populate('userId', 'name email')
      .lean();

    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit log not found.' });
    }

    return successResponse(res, log, 'Audit log fetched.');
  } catch (err) {
    next(err);
  }
});

module.exports = router;

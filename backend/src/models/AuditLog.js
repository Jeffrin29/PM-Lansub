const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for system/anonymous actions
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      uppercase: true,
      // e.g. LOGIN, LOGOUT, CREATE_PROJECT, UPDATE_TASK, DELETE_USER
    },
    entityType: {
      type: String,
      enum: [
        'auth', 'user', 'organization', 'project', 'task',
        'role', 'permission', 'notification', 'file', 'session', 'system',
      ],
      required: [true, 'Entity type is required'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    // Changed fields (before/after snapshot for sensitive ops)
    changes: {
      before: { type: mongoose.Schema.Types.Mixed, default: null },
      after: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'warning'],
      default: 'success',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    // Audit logs are append-only — disable updates
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
auditLogSchema.index({ organizationId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

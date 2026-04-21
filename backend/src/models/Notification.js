const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    title: {
      type: String,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_completed',
        'task_deadline',
        'task_overdue',
        'task_commented',
        'project_created',
        'project_updated',
        'project_completed',
        'project_deadline',
        'member_invited',
        'member_joined',
        'role_changed',
        'system',
        'mention',
        'birthday',
        'meeting',
        'discussion_replied',
        'leave_approved',
        'leave_rejected',
      ],
      required: [true, 'Notification type is required'],
    },
    readStatus: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // Deep-link metadata for the frontend
    link: {
      entityType: { type: String, enum: ['project', 'task', 'user', 'organization', null], default: null },
      entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
      url: { type: String, default: null },
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    expiresAt: {
      type: Date,
      default: null,
      // TTL index will auto-expire old notifications
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
notificationSchema.index({ userId: 1, readStatus: 1 });
notificationSchema.index({ organizationId: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
// TTL: auto-delete read notifications after 30 days
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

module.exports = mongoose.model('Notification', notificationSchema);

'use strict';
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'task:created',
        'task:updated',
        'task:deleted',
        'task:moved',
        'task:completed',
        'task:assigned',
        'project:created',
        'project:updated',
        'project:deleted',
        'comment:added',
        'file:uploaded',
        'timesheet:submitted',
        'timesheet:approved',
        'timesheet:rejected',
        'discussion:created',
        'discussion:replied',
        'user:invited',
        'user:role_changed',
      ],
    },
    entityType: {
      type: String,
      enum: ['task', 'project', 'comment', 'file', 'timesheet', 'discussion', 'user'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

activitySchema.index({ organizationId: 1, createdAt: -1 });
activitySchema.index({ userId: 1, organizationId: 1 });
activitySchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('Activity', activitySchema);

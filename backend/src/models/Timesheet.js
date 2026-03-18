'use strict';
const mongoose = require('mongoose');

const timesheetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    hours: {
      type: Number,
      required: [true, 'Hours is required'],
      min: [0.1, 'Minimum 0.1 hours'],
      max: [24, 'Cannot exceed 24 hours per entry'],
    },
    billingType: {
      type: String,
      enum: ['billable', 'non-billable', 'internal'],
      default: 'billable',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    notes: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

timesheetSchema.index({ organizationId: 1 });
timesheetSchema.index({ userId: 1, organizationId: 1 });
timesheetSchema.index({ projectId: 1, organizationId: 1 });
timesheetSchema.index({ date: 1, organizationId: 1 });
timesheetSchema.index({ status: 1, organizationId: 1 });

module.exports = mongoose.model('Timesheet', timesheetSchema);

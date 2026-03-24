'use strict';
const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HrEmployee',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    leaveType: {
      type: String,
      enum: ['Sick Leave', 'Casual Leave', 'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave', 'Other'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    approvalStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

leaveSchema.index({ organizationId: 1, approvalStatus: 1 });
leaveSchema.index({ employeeId: 1 });
leaveSchema.index({ userId: 1 });

module.exports = mongoose.model('Leave', leaveSchema);

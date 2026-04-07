'use strict';
const mongoose = require('mongoose');

const hrAttendanceSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'half-day', 'late'],
      default: 'present',
    },
  },
  { timestamps: true }
);

hrAttendanceSchema.index({ organizationId: 1, date: 1 });
hrAttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
hrAttendanceSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('HrAttendance', hrAttendanceSchema);

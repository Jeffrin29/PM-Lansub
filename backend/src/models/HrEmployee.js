'use strict';
const mongoose = require('mongoose');

const hrEmployeeSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      default: 'Employee',
    },
    department: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    phone: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

hrEmployeeSchema.index({ organizationId: 1 });
hrEmployeeSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('HrEmployee', hrEmployeeSchema);

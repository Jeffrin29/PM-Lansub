'use strict';
const mongoose = require('mongoose');

const hrEmployeeSchema = new mongoose.Schema(
  {
    // ─── Core references ───────────────────────────────────────────────────────
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,           // one HrEmployee per User
    },

    // ─── Employee identity ─────────────────────────────────────────────────────
    // NOTE: name & email are intentionally kept here for quick lookups / populate
    // without always joining User. They should mirror User.name / User.email.
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

    // ─── Employee ID (EMP001 format) ───────────────────────────────────────────
    employeeId: {
      type: String,
      unique: true,
      sparse: true,           // allows null during migration without violating unique
    },

    // ─── Job information ───────────────────────────────────────────────────────
    designation: {
      type: String,
      default: 'Employee',
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    // Keep legacy string 'department' for backward compat with older records
    department: {
      type: String,
      default: null,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'intern', 'contract'],
      default: 'full-time',
    },

    // ─── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },

    // ─── Contact / Location ────────────────────────────────────────────────────
    phone: {
      type: String,
      default: null,
    },
    workLocation: {
      type: String,
      default: null,
    },

    // ─── Emergency contact ─────────────────────────────────────────────────────
    emergencyContact: {
      name:     { type: String, default: null },
      phone:    { type: String, default: null },
      relation: { type: String, default: null },
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
hrEmployeeSchema.index({ organizationId: 1 });
hrEmployeeSchema.index({ organizationId: 1, status: 1 });
hrEmployeeSchema.index({ organizationId: 1, departmentId: 1 });
hrEmployeeSchema.index({ employeeId: 1 }, { sparse: true });

module.exports = mongoose.model('HrEmployee', hrEmployeeSchema);

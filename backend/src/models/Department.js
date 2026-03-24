'use strict';
const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

departmentSchema.index({ organizationId: 1 });

module.exports = mongoose.model('Department', departmentSchema);

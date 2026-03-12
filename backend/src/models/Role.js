const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
    isDefault: {
      type: Boolean,
      default: false,
    },
    isSystemRole: {
      type: Boolean,
      default: false,
      // System roles: super_admin, org_admin, member, viewer
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
      // Higher level = more authority (used for hierarchy checks)
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Compound unique: role name must be unique within org
roleSchema.index({ name: 1, organizationId: 1 }, { unique: true });
roleSchema.index({ organizationId: 1 });

module.exports = mongoose.model('Role', roleSchema);

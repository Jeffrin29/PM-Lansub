const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      unique: true,
      trim: true,
      lowercase: true,
      // e.g. "create_project", "view_dashboard"
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    category: {
      type: String,
      enum: ['dashboard', 'project', 'task', 'user', 'report', 'audit', 'settings', 'billing'],
      required: true,
    },
    isSystemPermission: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

permissionSchema.index({ category: 1 });

module.exports = mongoose.model('Permission', permissionSchema);

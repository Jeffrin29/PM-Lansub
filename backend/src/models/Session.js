const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    device: {
      type: String,
      default: 'Unknown Device',
      maxlength: 200,
    },
    browser: {
      type: String,
      default: null,
    },
    os: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    location: {
      country: { type: String, default: null },
      city: { type: String, default: null },
    },
    loginTime: {
      type: Date,
      default: Date.now,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
sessionSchema.index({ userId: 1, active: 1 });
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ organizationId: 1 });

module.exports = mongoose.model('Session', sessionSchema);

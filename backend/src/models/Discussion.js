'use strict';
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attachments: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        path: String,
      },
    ],
  },
  { timestamps: true }
);

const discussionSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
      maxlength: 500,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      maxlength: 10000,
      default: '',
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    isPinned: { type: Boolean, default: false },
    isClosed: { type: Boolean, default: false },
    comments: [commentSchema],
    lastActivityAt: { type: Date, default: Date.now },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

discussionSchema.index({ organizationId: 1, createdAt: -1 });
discussionSchema.index({ projectId: 1, organizationId: 1 });
discussionSchema.index({ topic: 'text', description: 'text' });

module.exports = mongoose.model('Discussion', discussionSchema);

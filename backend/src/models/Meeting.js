'use strict';
const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      default: '',
      maxlength: 5000,
    },
    date: {
      type: Date,
      required: [true, 'Meeting date is required'],
    },
    time: {
      type: String,          // e.g. "14:30"
      required: [true, 'Meeting time is required'],
    },
    meetingLink: {
      type: String,
      default: null,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed'],
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

meetingSchema.index({ organizationId: 1, date: -1 });
meetingSchema.index({ createdBy: 1, organizationId: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);

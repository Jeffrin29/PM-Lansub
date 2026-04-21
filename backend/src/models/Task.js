const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 2000 },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const attachmentSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    description: {
      type: String,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'in_progress', 'complete'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    startDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    estimatedHours: {
      type: Number,
      default: null,
      min: 0,
    },
    loggedHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    attachments: [attachmentSchema],
    comments: [commentSchema],
    subtasks: [
      {
        title: { type: String, required: true, maxlength: 300 },
        completed: { type: Boolean, default: false },
        completedAt: Date,
        assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedReason: {
      type: String,
      default: null,
    },
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    order: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
taskSchema.index({ organizationId: 1 });
taskSchema.index({ projectId: 1 });
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, organizationId: 1 });
taskSchema.index({ organizationId: 1, dueDate: 1 });
taskSchema.index({ title: 'text', description: 'text' });

// ─── Pre-save: Auto Sync & Validations ────────────────────────────────────────
taskSchema.pre('save', function (next) {
  // 1. Progress/Status Sync
  if (this.progress === 100 && this.status !== 'complete') {
    this.status = 'complete';
  } else if (this.status === 'complete' && this.progress !== 100) {
    this.progress = 100;
  }

  // 2. Date Validation
  if (this.startDate && this.dueDate && this.dueDate < this.startDate) {
    return next(new Error('Due date cannot be before start date'));
  }

  // 3. Completion logic
  if (this.status === 'complete' && !this.completedAt) {
    this.completedAt = new Date();
  }
  if (this.status !== 'complete') {
    this.completedAt = null;
    this.completedBy = null;
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);

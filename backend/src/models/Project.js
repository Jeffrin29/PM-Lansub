const mongoose = require('mongoose');

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

const projectSchema = new mongoose.Schema(
  {
    projectTitle: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required'],
    },
    teamMembers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['lead', 'developer', 'designer', 'analyst', 'tester', 'observer'], default: 'developer' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'active', 'review', 'completed', 'archived'],
      default: 'draft',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    budget: {
      allocated: { type: Number, default: 0, min: 0 },
      spent: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'USD', uppercase: true },
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    completion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    attachments: [attachmentSchema],
    milestones: [
      {
        title: { type: String, required: true },
        description: String,
        dueDate: Date,
        completed: { type: Boolean, default: false },
        completedAt: Date,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
projectSchema.index({ organizationId: 1 });
projectSchema.index({ organizationId: 1, status: 1 });
projectSchema.index({ organizationId: 1, owner: 1 });
projectSchema.index({ organizationId: 1, priority: 1 });
projectSchema.index({ 'teamMembers.userId': 1 });
projectSchema.index({ projectTitle: 'text', description: 'text' });

// ─── Virtual: task count ──────────────────────────────────────────────────────
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'projectId',
  count: true,
});

// ─── Pre-save ─────────────────────────────────────────────────────────────────
projectSchema.pre('save', function (next) {
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
    this.completion = 100;
  }
  if (this.status === 'archived' && !this.archivedAt) {
    this.archivedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);

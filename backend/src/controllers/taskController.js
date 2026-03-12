const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { successResponse, errorResponse, getPagination, paginatedResponse, getClientIp } = require('../utils/helpers');
const { createAuditLog } = require('../utils/auditLog');

// ─── List Tasks ────────────────────────────────────────────────────────────────
exports.getTasks = async (req, res, next) => {
  try {
    const { skip, limit, page, sort } = getPagination(req.query);
    const { status, priority, projectId, assignee, search, isBlocked } = req.query;

    const filter = { ...req.orgFilter };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (projectId) filter.projectId = projectId;
    if (assignee) filter.assignee = assignee;
    if (isBlocked !== undefined) filter.isBlocked = isBlocked === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignee', 'name email avatar')
        .populate('reporter', 'name email')
        .populate('projectId', 'projectTitle status')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(filter),
    ]);

    return successResponse(res, paginatedResponse(tasks, total, page, limit), 'Tasks fetched.');
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Task ───────────────────────────────────────────────────────────
exports.getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, ...req.orgFilter })
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('projectId', 'projectTitle status organizationId')
      .populate('comments.author', 'name email avatar')
      .populate('completedBy', 'name email');

    if (!task) return errorResponse(res, 'Task not found.', 404);
    return successResponse(res, task, 'Task fetched.');
  } catch (err) {
    next(err);
  }
};

// ─── Create Task ───────────────────────────────────────────────────────────────
exports.createTask = async (req, res, next) => {
  try {
    const {
      title, description, projectId, status, priority,
      dueDate, startDate, assignee, estimatedHours, tags, dependencies,
    } = req.body;

    // Verify project belongs to org
    const project = await Project.findOne({ _id: projectId, ...req.orgFilter });
    if (!project) return errorResponse(res, 'Project not found or access denied.', 404);

    const task = await Task.create({
      title,
      description,
      projectId,
      organizationId: req.user.organizationId,
      reporter: req.user.userId,
      assignee: assignee || null,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      startDate: startDate || null,
      estimatedHours: estimatedHours || null,
      tags: tags || [],
      dependencies: dependencies || [],
      createdBy: req.user.userId,
    });

    // Notify assignee
    if (assignee && assignee !== req.user.userId) {
      await Notification.create({
        userId: assignee,
        organizationId: req.user.organizationId,
        message: `You have been assigned a new task: "${title}" in project "${project.projectTitle}"`,
        title: 'Task Assigned',
        type: 'task_assigned',
        link: { entityType: 'task', entityId: task._id },
        priority: priority === 'urgent' ? 'high' : 'normal',
      });
    }

    await createAuditLog({
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      action: 'CREATE_TASK',
      entityType: 'task',
      entityId: task._id,
      description: `Task created: "${title}" in project "${project.projectTitle}"`,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    return successResponse(res, task, 'Task created.', 201);
  } catch (err) {
    next(err);
  }
};

// ─── Update Task ───────────────────────────────────────────────────────────────
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!task) return errorResponse(res, 'Task not found.', 404);

    const prevAssignee = task.assignee?.toString();
    const prevStatus = task.status;
    const before = { status: prevStatus, assignee: prevAssignee, priority: task.priority };

    const allowedFields = [
      'title', 'description', 'status', 'priority', 'dueDate', 'startDate',
      'assignee', 'estimatedHours', 'loggedHours', 'tags', 'isBlocked',
      'blockedReason', 'dependencies', 'order',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    if (task.status === 'done' && !task.completedBy) {
      task.completedBy = req.user.userId;
    }

    await task.save();

    // Notify new assignee if changed
    if (req.body.assignee && req.body.assignee !== prevAssignee && req.body.assignee !== req.user.userId) {
      await Notification.create({
        userId: req.body.assignee,
        organizationId: req.user.organizationId,
        message: `You have been assigned to task: "${task.title}"`,
        title: 'Task Assigned',
        type: 'task_assigned',
        link: { entityType: 'task', entityId: task._id },
      });
    }

    // Notify on status change
    if (task.status !== prevStatus && task.assignee) {
      await Notification.create({
        userId: task.assignee,
        organizationId: req.user.organizationId,
        message: `Task "${task.title}" status changed to "${task.status}"`,
        title: 'Task Updated',
        type: 'task_completed',
        link: { entityType: 'task', entityId: task._id },
      });
    }

    await createAuditLog({
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      action: 'UPDATE_TASK',
      entityType: 'task',
      entityId: task._id,
      description: `Task updated: "${task.title}"`,
      changes: { before, after: { status: task.status, assignee: task.assignee, priority: task.priority } },
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    return successResponse(res, task, 'Task updated.');
  } catch (err) {
    next(err);
  }
};

// ─── Delete Task ───────────────────────────────────────────────────────────────
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!task) return errorResponse(res, 'Task not found.', 404);

    await task.deleteOne();

    await createAuditLog({
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      action: 'DELETE_TASK',
      entityType: 'task',
      entityId: task._id,
      description: `Task deleted: "${task.title}"`,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    return successResponse(res, null, 'Task deleted.');
  } catch (err) {
    next(err);
  }
};

// ─── Add Comment to Task ────────────────────────────────────────────────────────
exports.addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const task = await Task.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!task) return errorResponse(res, 'Task not found.', 404);

    task.comments.push({ author: req.user.userId, content });
    await task.save();

    // Notify other participants
    if (task.assignee && task.assignee.toString() !== req.user.userId) {
      await Notification.create({
        userId: task.assignee,
        organizationId: req.user.organizationId,
        message: `New comment on task "${task.title}"`,
        title: 'Task Comment',
        type: 'task_commented',
        link: { entityType: 'task', entityId: task._id },
      });
    }

    const newComment = task.comments[task.comments.length - 1];
    return successResponse(res, newComment, 'Comment added.', 201);
  } catch (err) {
    next(err);
  }
};

// ─── Upload Task Attachment ────────────────────────────────────────────────────
exports.uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded.', 400);

    const task = await Task.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!task) return errorResponse(res, 'Task not found.', 404);

    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: req.user.userId,
    };

    task.attachments.push(attachment);
    await task.save();

    await createAuditLog({
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      action: 'UPLOAD_FILE',
      entityType: 'task',
      entityId: task._id,
      description: `File attached to task: "${req.file.originalname}"`,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    return successResponse(res, attachment, 'File uploaded.', 201);
  } catch (err) {
    next(err);
  }
};

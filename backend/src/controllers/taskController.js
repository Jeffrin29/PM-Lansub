const Task = require('../models/Task');
const Project = require('../models/Project');
const { logActivity } = require('../services/activityService');
const { sendNotification } = require('../services/notificationService');
const { successResponse, errorResponse, getPagination, paginatedResponse, getClientIp } = require('../utils/helpers');
const { createAuditLog } = require('../utils/auditLog');

// ─── List Tasks ────────────────────────────────────────────────────────────────
exports.getTasks = async (req, res, next) => {
  try {
    const { skip, limit, page, sort } = getPagination(req.query);
    const { status, priority, projectId, assignedTo, search, isBlocked } = req.query;

    const { role, userId, organizationId } = req.user;
    const isPrivileged = ['admin', 'hr'].includes(role);

    const filter = { ...req.orgFilter };

    // RBAC Filtering for Tasks
    if (role === 'employee') {
      filter.assignedTo = userId;
    } else if (role === 'project_manager' || role === 'manager') {
      // Find projects owned by PM to allow seeing all tasks in those projects
      const myProjects = await Project.find({ ...req.orgFilter, owner: userId }).select('_id').lean();
      const myProjectIds = myProjects.map(p => p._id);
      
      filter.$or = [
        { projectId: { $in: myProjectIds } },
        { createdBy: userId },
        { assignedTo: userId }
      ];
    }

    if (projectId) {
      // Security Check: Does user have access to this project?
      const project = await Project.findOne({ _id: projectId, ...req.orgFilter });
      if (!project) return errorResponse(res, 'Project not found.', 404);
      
      const hasAccess = isPrivileged || 
                        project.owner.toString() === userId || 
                        project.teamMembers.some(m => m.userId.toString() === userId);
      
      if (!hasAccess) {
        return errorResponse(res, 'Access denied to this project.', 403);
      }
      filter.projectId = projectId;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (isBlocked !== undefined) filter.isBlocked = isBlocked === 'true';

    // Search logic
    if (search) {
      const searchTerms = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
      if (filter.$or) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: filter.$or });
        filter.$and.push({ $or: searchTerms });
        delete filter.$or;
      } else {
        filter.$or = searchTerms;
      }
    }

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'name email avatar')
        .populate('reporter', 'name email')
        .populate('projectId', 'name status')   // Project.name is the correct field
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(filter),
    ]);

    return successResponse(res, paginatedResponse(tasks || [], total || 0, page, limit), 'Tasks fetched.');
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Task ───────────────────────────────────────────────────────────
exports.getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, ...req.orgFilter })
      .populate('assignedTo', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('projectId', 'name status organizationId')  // Project.name
      .populate('comments.author', 'name email avatar')
      .populate('completedBy', 'name email');

    if (!task) return errorResponse(res, 'Task not found.', 404);

    const { role, userId } = req.user;
    const isPrivileged = ['admin', 'hr', 'project_manager', 'manager'].includes(role);

    if (!isPrivileged) {
      // Check project membership or assignment
      const isAssignee = task.assignedTo?.toString() === userId;
      const isReporter = task.reporter?.toString() === userId;
      
      if (!isAssignee && !isReporter) {
          const project = await Project.findOne({
            _id: task.projectId,
            'teamMembers.userId': userId
          });
          if (!project) return errorResponse(res, 'Access denied to this task.', 403);
      }
    }

    return successResponse(res, task, 'Task fetched.');
  } catch (err) {
    next(err);
  }
};

// ─── Create Task ───────────────────────────────────────────────────────────────
exports.createTask = async (req, res, next) => {
  try {
    const {
      title, description, projectId, status, priority, progress,
      dueDate, startDate, assignedTo, estimatedHours, tags, dependencies,
    } = req.body;

    const { role, userId, organizationId } = req.user;
    const isPrivileged = ['admin', 'hr', 'project_manager', 'manager'].includes(role);

    // Permission Check: project membership
    const project = await Project.findOne({ _id: projectId, ...req.orgFilter });
    if (!project) return errorResponse(res, 'Project not found.', 404);
    
    const canCreate = isPrivileged || 
                      project.owner.toString() === userId || 
                      project.teamMembers.some(m => m.userId.toString() === userId);
    
    if (!canCreate) return errorResponse(res, 'Access denied to create tasks in this project.', 403);

    const normalizedStatus = Number(progress) === 100 ? 'complete' : (status || 'todo');

    const task = await Task.create({
      title,
      description,
      projectId,
      organizationId,
      reporter: userId,
      assignedTo: assignedTo || userId,
      status: normalizedStatus,
      priority: priority || 'medium',
      progress: progress || 0,
      dueDate: dueDate || null,
      startDate: startDate || null,
      estimatedHours: estimatedHours || null,
      tags: tags || [],
      dependencies: dependencies || [],
      createdBy: userId,
    });

    await lastRecordTask(task, req, 'create', `Task created: "${title}"`);

    if (assignedTo && assignedTo !== userId) {
      await sendNotification({
        userId: assignedTo,
        organizationId,
        title: 'Task Assigned',
        message: `Task assigned: "${title}"`,
        type: 'task_assigned',
        link: { type: 'task', id: task._id }
      });
    }

    await createAuditLog({
      userId, 
      organizationId,
      action: 'CREATE_TASK', 
      entityType: 'task', 
      entityId: task._id,
      description: `Task created: "${title}" in project "${project.name || project.projectTitle}"`,
      ipAddress: getClientIp(req), 
      userAgent: req.headers['user-agent'],
    });

    return successResponse(res, task, 'Task created.', 201);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return errorResponse(res, messages.join(', '), 400);
    }
    next(err);
  }
};

// ─── Update Task ───────────────────────────────────────────────────────────────
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!task) return errorResponse(res, 'Task not found.', 404);

    const { role, userId, organizationId } = req.user;
    const isPrivileged = ['admin', 'hr', 'project_manager', 'manager'].includes(role);

    // Permission Enforcement
    if (!isPrivileged) {
      const isOwner = task.createdBy.toString() === userId;
      const isAssignee = task.assignedTo?.toString() === userId;
      if (!isOwner && !isAssignee) {
        return errorResponse(res, 'You can only edit your own tasks.', 403);
      }
    }

    const before = { 
      status: task.status, 
      assignedTo: task.assignedTo?.toString(), 
      progress: task.progress,
      priority: task.priority
    };

    const allowedFields = [
      'title', 'description', 'status', 'priority', 'progress', 'dueDate', 'startDate',
      'assignedTo', 'estimatedHours', 'loggedHours', 'tags', 'isBlocked',
      'blockedReason', 'dependencies', 'order',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    if (task.progress === 100) task.status = 'complete';
    if (task.status === 'complete' && task.progress !== 100) task.progress = 100;

    if (task.status === 'complete' && !task.completedBy) {
      task.completedBy = userId;
    }

    await task.save();

    const meta = {};
    if (task.progress !== before.progress) meta.progress = { from: before.progress, to: task.progress };
    if (task.status !== before.status) meta.status = { from: before.status, to: task.status };

    await lastRecordTask(task, req, 'update', `Task updated: "${task.title}"`, meta);

    if (req.body.assignedTo && req.body.assignedTo !== before.assignedTo && req.body.assignedTo !== userId) {
      await sendNotification({
        userId: req.body.assignedTo,
        organizationId,
        title: 'Task Assigned',
        message: `Task assigned: "${task.title}"`,
        type: 'task_assigned',
        link: { type: 'task', id: task._id }
      });
    }

    await createAuditLog({
      userId, organizationId,
      action: 'UPDATE_TASK', entityType: 'task', entityId: task._id,
      description: `Task updated: "${task.title}"`,
      changes: { before, after: { status: task.status, assignedTo: task.assignedTo, progress: task.progress } },
      ipAddress: getClientIp(req), userAgent: req.headers['user-agent'],
    });

    return successResponse(res, task, 'Task updated.');
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return errorResponse(res, messages.join(', '), 400);
    }
    next(err);
  }
};

// ─── Delete Task ───────────────────────────────────────────────────────────────
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!task) return errorResponse(res, 'Task not found.', 404);

    const { role, userId, organizationId } = req.user;
    const isPrivileged = ['admin', 'hr', 'project_manager', 'manager'].includes(role);

    if (!isPrivileged) {
      if (task.createdBy.toString() !== userId) {
        return errorResponse(res, "You cannot delete other users' tasks.", 403);
      }
    }

    await task.deleteOne();

    await lastRecordTask(task, req, 'delete', `Task deleted: "${task.title}"`);

    await createAuditLog({
      userId, organizationId,
      action: 'DELETE_TASK', entityType: 'task', entityId: task._id,
      description: `Task deleted: "${task.title}"`,
      ipAddress: getClientIp(req), userAgent: req.headers['user-agent'],
    });

    return successResponse(res, null, 'Task deleted.');
  } catch (err) {
    next(err);
  }
};

// ─── Add Comment ───────────────────────────────────────────────────────────────
exports.addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const task = await Task.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!task) return errorResponse(res, 'Task not found.', 404);

    task.comments.push({ author: req.user.userId, content });
    await task.save();

    return successResponse(res, task.comments[task.comments.length - 1], 'Comment added.', 201);
  } catch (err) {
    next(err);
  }
};

// ─── Upload Attachment ─────────────────────────────────────────────────────────
exports.uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded.', 400);
    const task = await Task.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!task) return errorResponse(res, 'Task not found.', 404);

    const att = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: req.user.userId,
    };
    task.attachments.push(att);
    await task.save();

    return successResponse(res, att, 'File uploaded.', 201);
  } catch (err) {
    next(err);
  }
};

// ─── Internal Helper ──────────────────────────────────────────────────────────
async function lastRecordTask(task, req, type, description, metadata = {}) {
  try {
    await logActivity({
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      action: `task:${type === 'create' ? 'created' : type === 'update' ? 'updated' : 'deleted'}`,
      entityType: 'task',
      entityId: task._id,
      description: description,
      metadata
    });
  } catch (e) {
    console.error('Task Log Failed:', e);
  }
}


const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { successResponse, errorResponse, getPagination, paginatedResponse, getClientIp } = require('../utils/helpers');
const { createAuditLog } = require('../utils/auditLog');
const { logTaskActivity } = require('../utils/activityLogger');

// ─── List Tasks ────────────────────────────────────────────────────────────────
exports.getTasks = async (req, res, next) => {
  try {
    const { skip, limit, page, sort } = getPagination(req.query);
    const { status, priority, projectId, assignedTo, search, isBlocked } = req.query;

    const userRole = req.user.role?.name?.toLowerCase();
    const isPrivileged = ['admin', 'hr', 'project_manager'].includes(userRole);

    const filter = { organizationId: req.user.organizationId };

    // Dashboard consistency: we need projects where the user is a member or all if privileged
    let accessibleProjectIds = [];
    if (!isPrivileged) {
      const myProjects = await Project.find({ 
        organizationId: req.user.organizationId,
        $or: [
          { owner: req.user.userId },
          { 'teamMembers.userId': req.user.userId }
        ]
      }).select('_id');
      accessibleProjectIds = myProjects.map(p => p._id);
      
      // Project membership constraint
      filter.projectId = { $in: accessibleProjectIds };

      // Field isolation (already exists, but refined)
      filter.$or = [
        { assignedTo: req.user.userId },
        { createdBy: req.user.userId },
        // Also allow viewing all tasks in projects you're a member of??? 
        // User said: "Users should only access tasks belonging to their assigned projects" 
        // AND "Permissions: employee can only edit their own tasks"
        // This implies they can view other tasks in the project? 
        // I'll keep the view logic as is (assigned or created) for employee unless it's too restrictive.
        // Actually, many PM tools allow members to see all project tasks. 
        // User rule: "employee: edit ONLY their own tasks". Doesn't say "view only their own".
        // I'll expand it to: can VIEW all tasks in projects they're members of, but only EDIT their own.
        // Wait, "RBAC Data Isolation: filter tasks showing correct analytics per user role"
        // Let's stick with the user's previous preference for view isolation: assigned or created.
        { assignedTo: req.user.userId },
        { createdBy: req.user.userId }
      ];
    }

    if (projectId) {
      // If employee, check if they can access THIS specific project
      if (!isPrivileged && !accessibleProjectIds.some(id => id.toString() === projectId)) {
        return successResponse(res, paginatedResponse([], 0, page, limit), 'No access to this project.');
      }
      filter.projectId = projectId;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (isBlocked !== undefined) filter.isBlocked = isBlocked === 'true';

    // Search logic wrapper
    if (search) {
      const searchTerms = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
      if (filter.$or) {
        const existingOr = filter.$or;
        delete filter.$or;
        filter.$and = [{ $or: existingOr }, { $or: searchTerms }];
      } else {
        filter.$or = searchTerms;
      }
    }

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'name email avatar')
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
      .populate('assignedTo', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('projectId', 'projectTitle status organizationId')
      .populate('comments.author', 'name email avatar')
      .populate('completedBy', 'name email');

    if (!task) return errorResponse(res, 'Task not found.', 404);

    const userRole = req.user.role?.name?.toLowerCase();
    const isPrivileged = ['admin', 'hr', 'project_manager'].includes(userRole);

    if (!isPrivileged) {
      // Check project membership for security
      const project = await Project.findOne({ 
        _id: task.projectId, 
        $or: [{ owner: req.user.userId }, { 'teamMembers.userId': req.user.userId }]
      });
      if (!project) return errorResponse(res, 'Access denied to this project.', 403);
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

    const userRole = req.user.role?.name?.toLowerCase();
    const isPrivileged = ['admin', 'hr', 'project_manager'].includes(userRole);

    // Permission Check: project membership
    const projectFilter = { _id: projectId, ...req.orgFilter };
    if (!isPrivileged) {
      projectFilter.$or = [{ owner: req.user.userId }, { 'teamMembers.userId': req.user.userId }];
    }
    
    const project = await Project.findOne(projectFilter);
    if (!project) return errorResponse(res, 'Project not found or access denied.', 403);

    // If progress is 100, auto-set status to complete (also handled in pre-save)
    const normalizedStatus = Number(progress) === 100 ? 'complete' : (status || 'todo');

    const task = await Task.create({
      title,
      description,
      projectId,
      organizationId: req.user.organizationId,
      reporter: req.user.userId,
      assignedTo: assignedTo || null,
      status: normalizedStatus,
      priority: priority || 'medium',
      progress: progress || 0,
      dueDate: dueDate || null,
      startDate: startDate || null,
      estimatedHours: estimatedHours || null,
      tags: tags || [],
      dependencies: dependencies || [],
      createdBy: req.user.userId,
    });

    await logTaskActivity({ 
      userId: req.user.userId, 
      action: 'create', 
      taskId: task._id,
      description: `Task created: "${title}" by ${req.user.userId}`
    });

    if (assignedTo && assignedTo !== req.user.userId) {
      await Notification.create({
        userId: assignedTo,
        organizationId: req.user.organizationId,
        message: `Task assigned: "${title}"`,
        title: 'Task Assigned',
        type: 'task_assigned',
        link: { entityType: 'task', entityId: task._id },
        priority: priority === 'urgent' ? 'high' : 'normal',
      });
    }

    await createAuditLog({
      userId: req.user.userId, organizationId: req.user.organizationId,
      action: 'CREATE_TASK', entityType: 'task', entityId: task._id,
      description: `Task created: "${title}" in project "${project.projectTitle}"`,
      ipAddress: getClientIp(req), userAgent: req.headers['user-agent'],
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

    const userRole = req.user.role?.name?.toLowerCase();
    const isPrivileged = ['admin', 'hr', 'project_manager'].includes(userRole);

    // Permission Enforcement
    if (!isPrivileged) {
      const isOwner = task.createdBy.toString() === req.user.userId;
      const isAssignee = task.assignedTo?.toString() === req.user.userId;
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

    // Handle Auto-sync Logic
    if (task.progress === 100) task.status = 'complete';
    if (task.status === 'complete' && task.progress !== 100) task.progress = 100;

    if (task.status === 'complete' && !task.completedBy) {
      task.completedBy = req.user.userId;
    }

    await task.save();

    // Advanced Logging
    const meta = {};
    if (task.progress !== before.progress) meta.progress = { from: before.progress, to: task.progress };
    if (task.status !== before.status) meta.status = { from: before.status, to: task.status };
    if (task.assignedTo?.toString() !== before.assignedTo) {
      meta.assignedTo = { from: before.assignedTo, to: task.assignedTo?.toString() };
    }

    await logTaskActivity({ 
      userId: req.user.userId, 
      action: 'update', 
      taskId: task._id,
      description: `Task updated: "${task.title}"`,
      metadata: meta
    });

    // Notify new assignedTo
    if (req.body.assignedTo && req.body.assignedTo !== before.assignedTo && req.body.assignedTo !== req.user.userId) {
      await Notification.create({
        userId: req.body.assignedTo, organizationId: req.user.organizationId,
        message: `Task assigned: "${task.title}"`, title: 'Task Assigned',
        type: 'task_assigned', link: { entityType: 'task', entityId: task._id },
      });
    }

    await createAuditLog({
      userId: req.user.userId, organizationId: req.user.organizationId,
      action: 'UPDATE_TASK', entityType: 'task', entityId: task._id,
      description: `Task updated: "${task.title}"`,
      changes: { before, after: { status: task.status, assignedTo: task.assignedTo, progress: task.progress } },
      ipAddress: getClientIp(req), userAgent: req.headers['user-agent'],
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

    const userRole = req.user.role?.name?.toLowerCase();
    const isPrivileged = ['admin', 'hr', 'project_manager'].includes(userRole);

    if (!isPrivileged) {
      // rule: cannot delete others' tasks
      if (task.createdBy.toString() !== req.user.userId) {
        return errorResponse(res, "You cannot delete other users' tasks.", 403);
      }
    }

    await task.deleteOne();

    await logTaskActivity({ 
      userId: req.user.userId, 
      action: 'delete', 
      taskId: task._id,
      description: `Task deleted: "${task.title}"`
    });

    await createAuditLog({
      userId: req.user.userId, organizationId: req.user.organizationId,
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

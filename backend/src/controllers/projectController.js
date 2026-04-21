const Project = require('../models/Project');
const { logActivity } = require('../services/activityService');
const { sendNotification } = require('../services/notificationService');
const { successResponse, errorResponse, getPagination, paginatedResponse, getClientIp } = require('../utils/helpers');
const { createAuditLog } = require('../utils/auditLog');
const path = require('path');

// ─── List Projects ────────────────────────────────────────────────────────────
exports.getProjects = async (req, res) => {
  try {
    console.log("ORG ID:", req.organizationId);

    const projects = await Project.find({
      organizationId: req.organizationId
    })
    .populate("owner", "name email")
    .sort({ createdAt: -1 });

    console.log("PROJECTS FOUND:", projects.length);

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get Single Project ────────────────────────────────────────────────────────
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, ...req.orgFilter })
      .populate('owner', 'name email avatar')
      .populate('teamMembers.userId', 'name email avatar')
      .populate('createdBy', 'name email');

    if (!project) return errorResponse(res, 'Project not found.', 404);
    return successResponse(res, project, 'Project fetched.');
  } catch (err) {
    next(err);
  }
};

// ─── Create Project ───────────────────────────────────────────────────────────
exports.createProject = async (req, res, next) => {
  try {
    const {
      name, projectTitle, description, status, priority, budget,
      startDate, endDate, riskLevel, teamMembers, tags, milestones, completion,
    } = req.body;

    const finalName = name || projectTitle;

    const project = await Project.create({
      name: finalName,
      description,
      organizationId: req.user.organizationId,
      owner: req.user.userId,
      status: status || 'draft',
      priority: priority || 'medium',
      budget,
      startDate,
      endDate,
      riskLevel: riskLevel || 'low',
      teamMembers: teamMembers || [],
      tags: tags || [],
      milestones: milestones || [],
      completion: completion || 0,
      createdBy: req.user.userId,
    });

    // ✅ LOG ACTIVITY
    await logActivity({
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      action: 'project:created',
      entityType: 'project',
      entityId: project._id,
      description: `Project created: "${finalName}"`
    });

    // Notify team members
    if (teamMembers && teamMembers.length > 0) {
      for (const member of teamMembers) {
        await sendNotification({
          userId: member.userId,
          organizationId: req.user.organizationId,
          title: 'Added to Project',
          message: `You have been added to project: "${finalName}"`,
          type: 'project_created',
          link: { type: 'project', id: project._id }
        });
      }
    }

    await createAuditLog({
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      action: 'CREATE_PROJECT',
      entityType: 'project',
      entityId: project._id,
      description: `Project created: "${finalName}"`,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    return successResponse(res, project, 'Project created.', 201);
  } catch (err) {
    next(err);
  }
};

// ─── Update Project ───────────────────────────────────────────────────────────
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!project) return errorResponse(res, 'Project not found.', 404);

    const { role, userId } = req.user;
    const isAdmin = role === 'admin' || role === 'hr';
    const isOwner = project.owner.toString() === userId;
    
    if (!isAdmin && !isOwner) {
      return errorResponse(res, 'Only the project owner or admin can update this project.', 403);
    }

    const allowedFields = [
      'name', 'projectTitle', 'description', 'status', 'priority', 'budget',
      'startDate', 'endDate', 'riskLevel', 'completion',
      'teamMembers', 'tags', 'milestones', 'owner',
    ];
    const before = project.toObject();

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'projectTitle') project.name = req.body[field];
        else project[field] = req.body[field];
      }
    });

    await project.save();

    // ✅ LOG ACTIVITY
    await logActivity({
      userId: userId,
      organizationId: req.user.organizationId,
      action: 'project:updated',
      entityType: 'project',
      entityId: project._id,
      description: `Project updated: "${project.name}"`
    });

    await createAuditLog({
      userId: userId,
      organizationId: req.user.organizationId,
      action: 'UPDATE_PROJECT',
      entityType: 'project',
      entityId: project._id,
      description: `Project updated: "${project.projectTitle}"`,
      changes: { before: { status: before.status, priority: before.priority }, after: { status: project.status, priority: project.priority } },
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    return successResponse(res, project, 'Project updated.');
  } catch (err) {
    next(err);
  }
};

// ─── Delete Project ───────────────────────────────────────────────────────────
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!project) return errorResponse(res, 'Project not found.', 404);

    const { role, userId } = req.user;
    const isAdmin = role === 'admin';
    const isOwner = project.owner.toString() === userId;

    if (!isAdmin && !isOwner) {
      return errorResponse(res, 'Only the project owner or admin can delete this project.', 403);
    }

    await project.deleteOne();

    // ✅ LOG ACTIVITY
    await logActivity({
      userId: userId,
      organizationId: req.user.organizationId,
      action: 'project:deleted',
      entityType: 'project',
      entityId: project._id,
      description: `Project deleted: "${project.name}"`
    });

    await createAuditLog({
      userId: userId,
      organizationId: req.user.organizationId,
      action: 'DELETE_PROJECT',
      entityType: 'project',
      entityId: project._id,
      description: `Project deleted: "${project.name}"`,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    return successResponse(res, null, 'Project deleted.');
  } catch (err) {
    next(err);
  }
};

// ─── Upload Project Attachment ─────────────────────────────────────────────────
exports.uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded.', 400);

    const project = await Project.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!project) return errorResponse(res, 'Project not found.', 404);

    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: req.user.userId,
    };

    project.attachments.push(attachment);
    await project.save();

    await createAuditLog({
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      action: 'UPLOAD_FILE',
      entityType: 'project',
      entityId: project._id,
      description: `File uploaded to project: "${req.file.originalname}"`,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    return successResponse(res, attachment, 'File uploaded.', 201);
  } catch (err) {
    next(err);
  }
};

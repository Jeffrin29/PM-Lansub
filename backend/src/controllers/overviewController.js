'use strict';
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Discussion = require('../models/Discussion');
const { successResponse, errorResponse } = require('../utils/helpers');

exports.getOverview = async (req, res) => {
  try {
    const { organizationId, userId, role } = req.user;
    const orgId = new mongoose.Types.ObjectId(organizationId);
    const isPrivileged = ['admin', 'hr'].includes(role);

    // Role-scoped project filter
    let projectFilter = { organizationId: orgId };
    if (role === 'project_manager') {
      projectFilter.$or = [{ owner: userId }, { 'teamMembers.userId': userId }];
    } else if (role === 'employee') {
      projectFilter.$or = [{ owner: userId }, { 'teamMembers.userId': userId }];
    }

    // Fetch data with org isolation
    const [projects, tasks, users, comments] = await Promise.all([
      Project.find(projectFilter).limit(6),
      Task.find({ organizationId: orgId }),
      // Only admin/hr can see all users
      isPrivileged
        ? User.find({ organizationId: orgId }).select('name email role status')
        : [],
      Comment.find({ organizationId: orgId })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Task filter based on role
    let visibleTasks = tasks;
    if (role === 'employee') {
      visibleTasks = tasks.filter(t =>
        t.assignedTo?.toString() === userId ||
        t.createdBy?.toString() === userId
      );
    } else if (role === 'project_manager') {
      const projectIds = projects.map(p => p._id.toString());
      visibleTasks = tasks.filter(t => projectIds.includes(t.projectId?.toString()));
    }

    // Urgent tasks (overdue + not completed)
    const now = new Date();
    const urgentTasks = visibleTasks
      .filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'complete')
      .map(t => ({
        _id: t._id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate,
        project: projects.find(p => p._id.toString() === t.projectId?.toString())?.projectTitle || 'N/A'
      }));

    // Project progress (real-time calculation)
    const projectProgress = projects.map(p => {
      const pTasks = tasks.filter(t => t.projectId?.toString() === p._id.toString());
      const total = pTasks.length;
      const completed = pTasks.filter(t => t.status === 'complete').length;
      return {
        _id: p._id,
        projectTitle: p.projectTitle,
        completionPercentage: total === 0 ? (p.completion || 0) : Math.round((completed / total) * 100),
        status: p.status
      };
    });

    // Global Comments (mapped for frontend)
    const finalComments = comments.map(c => ({
      id: c._id,
      user: c.user?.name || 'Unknown',
      text: c.text,
      time: c.createdAt
    }));

    // Stats
    const stats = {
      activeProjects: projects.filter(p => p.status === 'active').length,
      pendingTasks: visibleTasks.filter(t => t.status !== 'complete').length,
      teamSize: users.length
    };

    return successResponse(res, {
      urgentTasks: urgentTasks || [],
      users: users || [],
      projectProgress: projectProgress || [],
      comments: finalComments || [],
      stats
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

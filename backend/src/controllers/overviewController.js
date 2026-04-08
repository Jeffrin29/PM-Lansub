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
    const { organizationId } = req.user;
    const orgId = new mongoose.Types.ObjectId(organizationId);

    // 1. Fetch data with org isolation
    const [projects, tasks, users, comments] = await Promise.all([
      Project.find({ organizationId: orgId }).limit(6),
      Task.find({ organizationId: orgId }),
      User.find({ organizationId: orgId }).select('name email role status'),
      Comment.find({ organizationId: orgId })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // 2. Urgent tasks (overdue + not completed)
    const now = new Date();
    const urgentTasks = tasks
      .filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'complete')
      .map(t => ({
        _id: t._id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate,
        project: projects.find(p => p._id.toString() === t.projectId?.toString())?.projectTitle || 'N/A'
      }));

    // 3. Project progress (real-time calculation)
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

    // 4. Global Comments (mapped for frontend)
    const finalComments = comments.map(c => ({
      id: c._id,
      user: c.user?.name || 'Unknown',
      text: c.text,
      time: c.createdAt
    }));

    // 5. Stats
    const stats = {
      activeProjects: projects.filter(p => p.status === 'active').length,
      pendingTasks: tasks.filter(t => t.status !== 'complete').length,
      teamSize: users.length
    };

    return successResponse(res, {
      urgentTasks,
      users,
      projectProgress,
      comments: finalComments,
      stats
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

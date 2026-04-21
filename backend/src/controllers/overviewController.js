'use strict';
const mongoose   = require('mongoose');
const Project    = require('../models/Project');
const Task       = require('../models/Task');
const User       = require('../models/User');
const Comment    = require('../models/Comment');
const Attendance = require('../models/Attendance');
const { successResponse, errorResponse } = require('../utils/helpers');

exports.getOverview = async (req, res) => {
  try {
    const { organizationId, userId, role } = req.user;
    console.log(`[OVERVIEW] Request for User: ${userId}, Role: ${role}, Org: ${organizationId}`);

    const isPrivileged = ['admin', 'hr'].includes(role);

    // Role-scoped project filter
    let projectFilter = { ...req.orgFilter };
    if (role === 'project_manager' || role === 'manager') {
      projectFilter.$or = [{ owner: userId }, { 'teamMembers.userId': userId }];
    } else if (role === 'employee') {
      projectFilter.$or = [{ owner: userId }, { 'teamMembers.userId': userId }];
    }

    // Fetch data with org isolation
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [projects, tasks, users, comments, todayAttendance] = await Promise.all([
      Project.find(projectFilter).limit(6).lean(),
      Task.find({ ...req.orgFilter }).lean(),
      isPrivileged
        ? User.find({ ...req.orgFilter }).select('name email role status').lean()
        : [],
      Comment.find({ ...req.orgFilter })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .catch(() => []),
      Attendance.find({ organizationId, date: { $gte: todayStart, $lte: todayEnd } })
        .select('workingHours')
        .lean()
        .catch(() => []),
    ]);

    console.log(`[OVERVIEW] Found ${projects.length} projects, ${tasks.length} tasks`);

    // Task filter based on role
    let visibleTasks = tasks;
    if (role === 'employee') {
      visibleTasks = tasks.filter(t =>
        t.assignedTo?.toString() === userId ||
        t.createdBy?.toString() === userId
      );
    } else if (role === 'project_manager' || role === 'manager') {
      const projectIds = projects.map(p => p._id.toString());
      visibleTasks = tasks.filter(t => 
        t.assignedTo?.toString() === userId || 
        t.createdBy?.toString() === userId ||
        projectIds.includes(t.projectId?.toString())
      );
    }

    // Urgent tasks (overdue + not completed)
    const now = new Date();
    const urgentTasks = visibleTasks
      .filter(t => t.dueDate && new Date(t.dueDate) < now && (t.status !== 'complete' && t.status !== 'completed'))
      .map(t => ({
        _id: t._id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate,
        project: projects.find(p => p._id.toString() === t.projectId?.toString())?.name || 
                 projects.find(p => p._id.toString() === t.projectId?.toString())?.projectTitle || 'N/A'
      }));

    // Project progress
    const projectProgress = projects.map(p => {
      const pTasks = tasks.filter(t => t.projectId?.toString() === p._id.toString());
      const total = pTasks.length;
      const completed = pTasks.filter(t => t.status === 'complete' || t.status === 'completed').length;
      return {
        _id: p._id,
        name: p.name || p.projectTitle,
        completionPercentage: total === 0 ? (p.completion || 0) : Math.round((completed / total) * 100),
        status: p.status
      };
    });

    // Global Comments
    const finalComments = (comments || []).map(c => ({
      id: c._id,
      user: c.user?.name || 'Unknown',
      text: c.text,
      time: c.createdAt
    }));

    // Stats — all live from DB
    const totalHours = (todayAttendance || []).reduce((s, a) => s + (a.workingHours || 0), 0);
    const dailyHours = todayAttendance.length > 0
      ? Math.round((totalHours / todayAttendance.length) * 10) / 10
      : 8;

    const stats = {
      activeProjects: projects.filter(p => p.status === 'active').length,
      pendingTasks:   visibleTasks.filter(t => t.status !== 'complete' && t.status !== 'completed').length,
      teamSize:       users.length || 0,
      dailyHours,
    };

    const finalData = {
      urgentTasks: urgentTasks || [],
      teamMembers: users || [],
      projectProgress: projectProgress || [],
      comments: finalComments || [],
      stats
    };

    console.log("[OVERVIEW] Success returning data keys:", Object.keys(finalData));
    return successResponse(res, finalData);
  } catch (err) {
    console.error("[OVERVIEW ERROR]:", err);
    return errorResponse(res, err.message, 500);
  }
};

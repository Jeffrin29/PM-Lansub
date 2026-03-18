const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { successResponse, errorResponse } = require('../utils/helpers');

// GET /api/dashboard/summary
const getSummary = async (req, res) => {
  try {
    const { organizationId } = req.user;

    const [totalProjects, activeProjects, allTasks, overdueTasksCount] = await Promise.all([
      Project.countDocuments({ organizationId }),
      Project.countDocuments({ organizationId, status: 'active' }),
      Task.find({ organizationId }).select('status dueDate').lean(),
      Task.countDocuments({
        organizationId,
        status: { $ne: 'done' },
        dueDate: { $lt: new Date() },
      }),
    ]);

    const completedTasks = allTasks.filter((t) => t.status === 'done').length;
    const teamUtilization =
      allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

    return successResponse(res, {
      totalProjects,
      activeProjects,
      completedTasks,
      overdueTasks: overdueTasksCount,
      teamUtilization,
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/health
const getHealth = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const now = new Date();

    const [tasks, projects] = await Promise.all([
      Task.find({ organizationId }).select('status dueDate assignee estimatedHours').lean(),
      Project.find({ organizationId, status: 'active' })
        .select('completionPercentage budget startDate endDate')
        .lean(),
    ]);

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === 'done').length;
    const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < now).length;
    const remainingTasks = totalTasks - doneTasks;
    const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    // Cost analysis based on budget
    let budgetStatus = '0% under budget';
    if (projects.length > 0) {
      const totalBudget = projects.reduce((a, p) => a + (p.budget?.allocated || 0), 0);
      const totalSpent = projects.reduce((a, p) => a + (p.budget?.spent || 0), 0);
      if (totalBudget > 0) {
        const underPct = Math.round(((totalBudget - totalSpent) / totalBudget) * 100);
        budgetStatus = `${Math.abs(underPct)}% ${underPct >= 0 ? 'under' : 'over'} budget`;
      }
    }

    // Time analysis
    let timeStatus = 'On schedule';
    if (projects.length > 0) {
      const avgCompletion =
        projects.reduce((a, p) => a + (p.completionPercentage || 0), 0) / projects.length;
      const firstProject = projects[0];
      if (firstProject.startDate && firstProject.endDate) {
        const totalDuration = firstProject.endDate - firstProject.startDate;
        const elapsed = now - firstProject.startDate;
        const expectedPct = totalDuration > 0 ? Math.round((elapsed / totalDuration) * 100) : 0;
        const diff = Math.round(avgCompletion - expectedPct);
        timeStatus = diff >= 0 ? `${diff}% ahead of schedule` : `${Math.abs(diff)}% behind schedule`;
      }
    }

    return successResponse(res, {
      time: timeStatus,
      tasks: `${remainingTasks} tasks remaining`,
      workload: `${overdueTasks} overdue`,
      progress: `${progressPct}% complete`,
      cost: budgetStatus,
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/task-analytics
const getTaskAnalytics = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const tasks = await Task.find({ organizationId }).select('status isBlocked').lean();

    const notStarted = tasks.filter((t) => t.status === 'todo').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress' || t.status === 'review').length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const blocked = tasks.filter((t) => t.isBlocked).length;

    return successResponse(res, [
      { name: 'Not Started', value: notStarted, color: '#94a3b8' },
      { name: 'In Progress', value: inProgress, color: '#3b82f6' },
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'Blocked', value: blocked, color: '#ef4444' },
    ]);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/project-progress
const getProjectProgress = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const projects = await Project.find({ organizationId })
      .select('projectTitle completionPercentage status')
      .limit(10)
      .lean();

    const data = projects.map((p) => ({
      name: p.projectTitle.length > 20 ? p.projectTitle.slice(0, 18) + '…' : p.projectTitle,
      progress: p.completionPercentage || 0,
      status: p.status,
    }));

    // Fallback phases if no projects
    if (data.length === 0) {
      return successResponse(res, [
        { name: 'Design', progress: 80 },
        { name: 'Development', progress: 45 },
        { name: 'Testing', progress: 20 },
        { name: 'Deployment', progress: 5 },
      ]);
    }

    return successResponse(res, data);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/workload
const getWorkload = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const now = new Date();

    const tasks = await Task.find({ organizationId, assignee: { $ne: null } })
      .select('assignee status dueDate')
      .populate('assignee', 'name email')
      .lean();

    // Group by assignee
    const map = {};
    for (const task of tasks) {
      if (!task.assignee) continue;
      const uid = task.assignee._id.toString();
      if (!map[uid]) {
        map[uid] = {
          user: task.assignee.name || task.assignee.email,
          assigned: 0,
          completed: 0,
          overdue: 0,
        };
      }
      map[uid].assigned++;
      if (task.status === 'done') map[uid].completed++;
      if (task.status !== 'done' && task.dueDate && task.dueDate < now) map[uid].overdue++;
    }

    return successResponse(res, Object.values(map));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/activity/recent
const getRecentActivity = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { page, limit, skip, sort } = getPagination(req.query);

    const [activities, total] = await Promise.all([
      Activity.find({ organizationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      Activity.countDocuments({ organizationId }),
    ]);

    return successResponse(res, paginatedResponse(activities, total, page, limit));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/cost-analysis
const getCostAnalysis = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const projects = await Project.find({ organizationId })
      .select('projectTitle budget createdAt')
      .lean();

    // Map projects to months for the chart trend
    // In a real app we'd aggregate expenses, but here we'll use budget fields
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const result = [];

    for (let i = Math.max(0, currentMonth - 3); i <= currentMonth; i++) {
      const monthName = months[i];
      let actual = 0;
      let planned = 0;
      let budget = 0;

      projects.forEach(p => {
        // Simple logic: if project created in or before this month, it contributes
        if (p.createdAt.getMonth() <= i) {
          actual += (p.budget?.spent || 0) / 4; // Mocking monthly spread
          planned += (p.budget?.allocated || 0) / 4;
          budget += (p.budget?.allocated || 0) / 4;
        }
      });

      result.push({
        label: monthName,
        actual: Math.round(actual),
        planned: Math.round(planned),
        budget: Math.round(budget)
      });
    }

    return successResponse(res, result);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/blocking-analytics
const getBlockingAnalytics = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const tasks = await Task.find({ organizationId, isBlocked: true })
      .select('title blockedReason projectId')
      .populate('projectId', 'projectTitle')
      .lean();

    const reasons = tasks.reduce((acc, t) => {
      const reason = t.blockedReason || 'Unknown';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

    return successResponse(res, {
      totalBlocked: tasks.length,
      reasons: Object.entries(reasons).map(([name, value]) => ({ name, value })),
      tasks: tasks.map(t => ({
        id: t._id,
        title: t.title,
        reason: t.blockedReason,
        project: t.projectId?.projectTitle
      }))
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  getSummary,
  getHealth,
  getTaskAnalytics,
  getProjectProgress,
  getWorkload,
  getRecentActivity,
  getCostAnalysis,
  getBlockingAnalytics,
};

const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { successResponse, errorResponse } = require('../utils/helpers');

// GET /api/dashboard/summary
const getSummary = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const orgFilter = req.orgFilter || { organizationId: req.user.organizationId };

    // Role-based filters — mirrors projectController.getProjects
    let projectFilter = { ...orgFilter };
    let taskFilter = { ...orgFilter };

    if (role === 'employee') {
      projectFilter.$or = [{ owner: userId }, { 'teamMembers.userId': userId }];
      taskFilter.assignedTo = userId;
    } else if (role === 'project_manager' || role === 'manager') {
      projectFilter.$or = [{ owner: userId }, { 'teamMembers.userId': userId }];
      taskFilter.$or = [{ assignedTo: userId }, { createdBy: userId }];
    }
    // admin / hr: orgFilter only

    const [totalProjects, activeProjects, allTasks, overdueTasksCount] = await Promise.all([
      Project.countDocuments(projectFilter),
      Project.countDocuments({ ...projectFilter, status: { $regex: /^active$/i } }),
      Task.find(taskFilter).select('status dueDate').lean(),
      Task.countDocuments({ ...taskFilter, status: { $nin: ['complete', 'completed'] }, dueDate: { $lt: new Date() } }),
    ]);

    const tasksArr = allTasks || [];
    const completedTasks = tasksArr.filter(t => ['complete', 'completed'].includes(String(t.status).toLowerCase())).length;
    const teamUtilization = tasksArr.length > 0 ? Math.round((completedTasks / tasksArr.length) * 100) : 0;

    return successResponse(res, {
      totalProjects,
      activeProjects,
      completedTasks,
      overdueTasks: overdueTasksCount,
      teamUtilization
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/health
const getHealth = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const now = new Date();
    let taskFilter = { ...req.orgFilter };
    let projectFilter = { ...req.orgFilter, status: { $regex: /^active$/i } };

    if (role === 'employee') {
      taskFilter.assignedTo = userId;
      projectFilter['teamMembers.userId'] = userId;
    } else if (role === 'project_manager' || role === 'manager') {
      taskFilter.$or = [{ assignedTo: userId }, { createdBy: userId }];
      projectFilter.owner = userId;
    }

    const [tasks, projects] = await Promise.all([
      Task.find(taskFilter).select('status dueDate').lean(),
      Project.find(projectFilter).select('completion budget').lean(),
    ]);

    const tasksArr = tasks || [];
    const doneTasks = tasksArr.filter(t => ['complete', 'completed'].includes(String(t.status).toLowerCase())).length;
    const overdueTasks = tasksArr.filter(t => !['complete', 'completed'].includes(String(t.status).toLowerCase()) && t.dueDate && t.dueDate < now).length;
    const progressPct = tasksArr.length > 0 ? Math.round((doneTasks / tasksArr.length) * 100) : 0;

    return successResponse(res, {
      time: "On schedule",
      tasks: `${tasksArr.length - doneTasks} tasks remaining`,
      workload: `${overdueTasks} overdue`,
      progress: `${progressPct}% complete`,
      cost: "On budget",
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/task-analytics
const getTaskAnalytics = async (req, res) => {
  try {
    const { role, userId } = req.user;
    let filter = { ...req.orgFilter };
    if (role === 'employee') filter.assignedTo = userId;
    else if (role === 'project_manager' || role === 'manager') filter.$or = [{ assignedTo: userId }, { createdBy: userId }];

    const tasks = await Task.find(filter).select('status isBlocked').lean();
    return successResponse(res, [
      { name: 'To Do', value: tasks.filter(t => ['todo', 'backlog'].includes(t.status)).length, color: '#94a3b8' },
      { name: 'In Progress', value: tasks.filter(t => ['in_progress', 'in progress'].includes(t.status)).length, color: '#3b82f6' },
      { name: 'Completed', value: tasks.filter(t => ['complete', 'completed'].includes(t.status)).length, color: '#10b981' },
      { name: 'Blocked', value: tasks.filter(t => t.isBlocked).length, color: '#ef4444' },
    ]);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/project-progress
const getProjectProgress = async (req, res) => {
  try {
    const { role, userId } = req.user;
    let filter = { ...req.orgFilter };
    if (role === 'employee') filter['teamMembers.userId'] = userId;
    else if (role === 'project_manager' || role === 'manager') filter.owner = userId;

    const projects = await Project.find(filter).select('name completion status').limit(10).lean();
    return successResponse(res, projects.map(p => ({
      name: p.name,
      progress: p.completion || 0,
      status: p.status
    })));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/workload
const getWorkload = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const now = new Date();
    let filter = { ...req.orgFilter };
    if (role === 'employee') filter.assignedTo = userId;

    const tasks = await Task.find(filter).select('status dueDate assignedTo').populate('assignedTo', 'name').lean();
    const map = {};
    tasks.forEach(t => {
      if (!t.assignedTo) return;
      const name = t.assignedTo.name || 'Unknown';
      if (!map[name]) map[name] = { user: name, assigned: 0, completed: 0, overdue: 0 };
      map[name].assigned++;
      if (['complete', 'completed'].includes(t.status)) map[name].completed++;
      if (!['complete', 'completed'].includes(t.status) && t.dueDate && t.dueDate < now) map[name].overdue++;
    });
    return successResponse(res, Object.values(map).slice(0, 10));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/cost-analysis
const getCostAnalysis = async (req, res) => {
  try {
    const { role, userId } = req.user;
    let filter = { ...req.orgFilter };
    if (role === 'employee') filter['teamMembers.userId'] = userId;
    else if (role === 'project_manager' || role === 'manager') filter.owner = userId;

    const projects = await Project.find(filter).select('budget createdAt').lean();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const result = [];
    for (let i = Math.max(0, currentMonth - 3); i <= currentMonth; i++) {
        let actual = 0, planned = 0, budget = 0;
        projects.forEach(p => {
            if (p.createdAt && p.createdAt.getMonth() <= i) {
                actual += (p.budget?.spent || 0) / 4;
                planned += (p.budget?.allocated || 0) / 4;
                budget += (p.budget?.allocated || 0) / 4;
            }
        });
        result.push({ label: months[i], actual: Math.round(actual), planned: Math.round(planned), budget: Math.round(budget) });
    }
    return successResponse(res, result);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/recent-activity
const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = await Activity.find({ ...req.orgFilter }).sort({ createdAt: -1 }).limit(limit).populate('userId', 'name').lean();
    return successResponse(res, activities.map(a => ({
      _id: a._id,
      action: a.action,
      metadata: a.metadata,
      createdAt: a.createdAt,
      userId: { name: a.userId?.name || 'System' }
    })));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/blocking-analytics
const getBlockingAnalytics = async (req, res) => {
  try {
    const tasks = await Task.find({ ...req.orgFilter, isBlocked: true }).select('title blockedReason').lean();
    return successResponse(res, tasks);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard - Unified Dashboard
const getUnifiedDashboard = async (req, res) => {
  try {
    const { role, userId, organizationId } = req.user;
    const now = new Date();
    const orgFilter = req.orgFilter || { organizationId };

    // ── Role-based filters (mirrors projectController.getProjects RBAC) ────────
    // admin / hr → see all org data (no user restriction)
    // employee / project_manager / manager → scoped to owned + team projects
    let projectFilter = { ...orgFilter };
    let taskFilter = { ...orgFilter };

    if (role === 'employee') {
      projectFilter.$or = [{ owner: userId }, { 'teamMembers.userId': userId }];
      taskFilter.assignedTo = userId;
    } else if (role === 'project_manager' || role === 'manager') {
      projectFilter.$or = [{ owner: userId }, { 'teamMembers.userId': userId }];
      taskFilter.$or = [{ assignedTo: userId }, { createdBy: userId }];
    }
    // admin / hr: no extra filter added — orgFilter only

    const [
      totalProjects,
      activeProjectsCount,
      allTasks,
      overdueTasksCount,
      recentActivities,
      projectList,
      costProjects
    ] = await Promise.all([
      Project.countDocuments(projectFilter),
      Project.countDocuments({ ...projectFilter, status: { $regex: /^active$/i } }),
      Task.find(taskFilter).select('status dueDate assignedTo isBlocked').populate('assignedTo', 'name').lean(),
      Task.countDocuments({ ...taskFilter, status: { $nin: ['complete', 'completed'] }, dueDate: { $lt: now } }),
      Activity.find({ ...orgFilter }).sort({ createdAt: -1 }).limit(10).populate('userId', 'name').lean(),
      Project.find(projectFilter).select('name completion status').limit(8).lean(),
      Project.find(projectFilter).select('budget createdAt').lean()
    ]);

    const tasksArr = allTasks || [];
    const completedTasks = tasksArr.filter(t => ['complete', 'completed'].includes(String(t.status).toLowerCase())).length;
    const teamUtilization = tasksArr.length > 0 ? Math.round((completedTasks / tasksArr.length) * 100) : 0;

    const doneTasks = completedTasks;
    const overdueTasks = tasksArr.filter(t => !['complete', 'completed'].includes(String(t.status).toLowerCase()) && t.dueDate && t.dueDate < now).length;
    const progressPct = tasksArr.length > 0 ? Math.round((doneTasks / tasksArr.length) * 100) : 0;

    const workloadMap = {};
    tasksArr.forEach(task => {
      if (!task.assignedTo) return;
      const uname = task.assignedTo.name || 'Unknown';
      if (!workloadMap[uname]) workloadMap[uname] = { user: uname, assigned: 0, completed: 0, overdue: 0 };
      workloadMap[uname].assigned++;
      if (['complete', 'completed'].includes(task.status)) workloadMap[uname].completed++;
      if (!['complete', 'completed'].includes(task.status) && task.dueDate && task.dueDate < now) workloadMap[uname].overdue++;
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = now.getMonth();
    const costAnalysis = [];
    for (let i = Math.max(0, currentMonth - 3); i <= currentMonth; i++) {
        let actual = 0, planned = 0, budget = 0;
        costProjects.forEach(p => {
            if (p.createdAt && p.createdAt.getMonth() <= i) {
                actual += (p.budget?.spent || 0) / 4;
                planned += (p.budget?.allocated || 0) / 4;
                budget += (p.budget?.allocated || 0) / 4;
            }
        });
        costAnalysis.push({ label: months[i], actual: Math.round(actual), planned: Math.round(planned), budget: Math.round(budget) });
    }

    const data = {
      summary: { totalProjects, activeProjects: activeProjectsCount, completedTasks, overdueTasks: overdueTasksCount, teamUtilization },
      health: { time: "On schedule", tasks: `${tasksArr.length - doneTasks} items remaining`, workload: `${overdueTasks} overdue`, progress: `${progressPct}% complete`, cost: "On budget" },
      taskAnalytics: [
        { name: 'To Do', value: tasksArr.filter(t => ['todo', 'backlog'].includes(t.status)).length, color: '#94a3b8' },
        { name: 'In Progress', value: tasksArr.filter(t => ['in_progress', 'in progress'].includes(t.status)).length, color: '#3b82f6' },
        { name: 'Completed', value: completedTasks, color: '#10b981' },
        { name: 'Blocked', value: tasksArr.filter(t => t.isBlocked).length, color: '#ef4444' },
      ],
      projectProgress: projectList.map(p => ({ name: p.name, progress: p.completion || 0, status: p.status })),
      recentActivity: recentActivities.map(a => ({ _id: a._id, action: a.action, metadata: a.metadata, createdAt: a.createdAt, userId: { name: a.userId?.name || 'System' } })),
      workload: Object.values(workloadMap).slice(0, 10),
      costAnalysis
    };

    return successResponse(res, data);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  getUnifiedDashboard,
  getSummary,
  getHealth,
  getTaskAnalytics,
  getProjectProgress,
  getWorkload,
  getCostAnalysis,
  getRecentActivity,
  getBlockingAnalytics
};

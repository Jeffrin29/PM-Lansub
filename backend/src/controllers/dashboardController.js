const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { successResponse, errorResponse } = require('../utils/helpers');

// GET /api/dashboard/summary
const getSummary = async (req, res) => {
  try {
    const { role, userId, organizationId } = req.user;
    console.log(`[DASHBOARD DEBUG] Summary Request by ${userId} (${role}) in Org ${organizationId}`);
    console.log(`[DEBUG CONTEXT] User Object:`, req.user);
    console.log(`[DEBUG CONTEXT] Org Filter:`, req.orgFilter);

    let projectFilter = { ...req.orgFilter };
    let taskFilter = { ...req.orgFilter };

    if (role === 'employee') {
      projectFilter['teamMembers.userId'] = userId;
      taskFilter.assignedTo = userId;
    } else if (role === 'project_manager' || role === 'manager') {
      // Consistent with projectController: PMs see owned or member projects
      projectFilter.$or = [{ owner: userId }, { 'teamMembers.userId': userId }];
      taskFilter.$or = [{ assignedTo: userId }, { createdBy: userId }];
    }

    const [totalProjects, activeProjects, allTasks, overdueTasksCount] = await Promise.all([
      Project.countDocuments(projectFilter),
      Project.countDocuments({ 
        ...projectFilter, 
        status: { $in: ['active', 'in_progress', 'review'] } 
      }),
      Task.find(taskFilter).select('status dueDate').lean(),
      Task.countDocuments({
        ...taskFilter,
        status: { $nin: ['complete', 'completed'] },
        dueDate: { $lt: new Date() },
      }),
    ]);

    const tasksArr = allTasks || [];
    const completedTasks = tasksArr.filter((t) => 
      ['complete', 'completed'].includes(String(t.status).toLowerCase())
    ).length;
    const teamUtilization =
      tasksArr.length > 0 ? Math.round((completedTasks / tasksArr.length) * 100) : 0;

    const data = {
      totalProjects: totalProjects || 0,
      activeProjects: activeProjects || 0,
      completedTasks: completedTasks || 0,
      overdueTasks: overdueTasksCount || 0,
      teamUtilization: teamUtilization || 0,
    };

    console.log("[DASHBOARD_RES] Summary:", data);
    return successResponse(res, data);
  } catch (err) {
    console.error("[DASHBOARD ERROR] getSummary:", err);
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/health
const getHealth = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const now = new Date();

    let taskFilter = { ...req.orgFilter };
    let projectFilter = { ...req.orgFilter, status: 'active' };

    if (role === 'employee') {
      taskFilter.assignedTo = userId;
      projectFilter['teamMembers.userId'] = userId;
    } else if (role === 'project_manager' || role === 'manager') {
      taskFilter.$or = [{ assignedTo: userId }, { createdBy: userId }];
      projectFilter.owner = userId;
    }

    const [tasks, projects] = await Promise.all([
      Task.find(taskFilter).select('status dueDate assignedTo estimatedHours').lean(),
      Project.find(projectFilter)
        .select('completionPercentage budget startDate endDate')
        .lean(),
    ]);

    const tasksArr = tasks || [];
    const projectsArr = projects || [];

    const totalTasks = tasksArr.length;
    const doneTasks = tasksArr.filter((t) => t.status === 'complete' || t.status === 'completed').length;
    const overdueTasks = tasksArr.filter((t) => (t.status !== 'complete' && t.status !== 'completed') && t.dueDate && t.dueDate < now).length;
    const remainingTasks = totalTasks - doneTasks;
    const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    let budgetStatus = '0% under budget';
    if (projectsArr.length > 0) {
      const totalAllocated = projectsArr.reduce((a, p) => a + (p.budget?.allocated || 0), 0);
      const totalSpent = projectsArr.reduce((a, p) => a + (p.budget?.spent || 0), 0);
      if (totalAllocated > 0) {
        const underPct = Math.round(((totalAllocated - totalSpent) / totalAllocated) * 100);
        budgetStatus = `${Math.abs(underPct)}% ${underPct >= 0 ? 'under' : 'over'} budget`;
      }
    }

    let timeStatus = 'On schedule';
    if (projectsArr.length > 0) {
      const activeProjs = projectsArr.filter(p => p.startDate && p.endDate);
      if (activeProjs.length > 0) {
        const avgCompletion = activeProjs.reduce((a, p) => a + (p.completionPercentage || p.completion || 0), 0) / activeProjs.length;
        const firstProject = activeProjs[0];
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
    const { role, userId } = req.user;
    let filter = { ...req.orgFilter };

    if (role === 'employee') {
      filter.assignedTo = userId;
    } else if (role === 'project_manager' || role === 'manager') {
      filter.$or = [{ assignedTo: userId }, { createdBy: userId }];
    }

    const tasksArr = await Task.find(filter).select('status isBlocked').lean();

    const notStarted = tasksArr.filter((t) => t.status === 'todo' || t.status === 'backlog').length;
    const inProgress = tasksArr.filter((t) => t.status === 'in_progress' || t.status === 'in progress').length;
    const completed = tasksArr.filter((t) => t.status === 'complete' || t.status === 'completed').length;
    const blocked = tasksArr.filter((t) => t.isBlocked).length;

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
    const { role, userId } = req.user;
    let filter = { ...req.orgFilter };

    if (role === 'employee') {
      filter['teamMembers.userId'] = userId;
    } else if (role === 'project_manager' || role === 'manager') {
      filter.owner = userId;
    }

    const projects = await Project.find(filter)
      .select('name completion completionPercentage status')   // Project.name
      .limit(10)
      .lean();

    const data = (projects || []).map((p) => ({
      name: (p.name || '').length > 20
        ? (p.name || '').slice(0, 18) + '…'
        : (p.name || 'Untitled'),
      progress: p.completionPercentage || p.completion || 0,
      status: p.status,
    }));

    return successResponse(res, data.length > 0 ? data : [
      { name: 'No Projects', progress: 0 }
    ]);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/workload
const getWorkload = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const now = new Date();

    let filter = { ...req.orgFilter, assignedTo: { $ne: null } };

    if (role === 'employee') {
      filter.assignedTo = userId;
    } else if (role === 'project_manager' || role === 'manager') {
      const myProjects = await Project.find({ ...req.orgFilter, owner: userId }).select('_id').lean();
      filter.projectId = { $in: myProjects.map(p => p._id) };
    }

    const tasks = await Task.find(filter)
      .select('assignedTo status dueDate')
      .populate('assignedTo', 'name email')
      .lean();

    const map = {};
    const tasksArr = tasks || [];
    for (const task of tasksArr) {
      if (!task.assignedTo) continue;
      const uid = task.assignedTo._id.toString();
      if (!map[uid]) {
        map[uid] = {
          user: task.assignedTo.name || task.assignedTo.email,
          assigned: 0,
          completed: 0,
          overdue: 0,
        };
      }
      map[uid].assigned++;
      if (task.status === 'complete' || task.status === 'completed') map[uid].completed++;
      if (task.status !== 'complete' && task.status !== 'completed' && task.dueDate && task.dueDate < now) map[uid].overdue++;
    }

    return successResponse(res, Object.values(map));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/recent-activity
const getRecentActivity = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const limit = parseInt(req.query.limit) || 10;

    let filter = { ...req.orgFilter };
    if (role === 'employee') {
      filter.userId = userId;
    }

    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .lean();

    return successResponse(res, activities || []);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/dashboard/cost-analysis
const getCostAnalysis = async (req, res) => {
  try {
    const { role, userId } = req.user;

    let filter = { ...req.orgFilter };
    if (role === 'employee') {
      filter['teamMembers.userId'] = userId;
    } else if (role === 'project_manager' || role === 'manager') {
      filter.owner = userId;
    }

    const projectsArr = await Project.find(filter)
      .select('name budget createdAt')   // Project.name is the correct field
      .lean();

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const result = [];

    for (let i = Math.max(0, currentMonth - 3); i <= currentMonth; i++) {
      const monthName = months[i];
      let actual = 0, planned = 0, budget = 0;

      projectsArr.forEach(p => {
        if (p.createdAt && p.createdAt.getMonth() <= i) {
          actual += (p.budget?.spent || 0) / 4;
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
    const { role, userId } = req.user;

    let filter = { ...req.orgFilter, isBlocked: true };
    if (role === 'employee') {
      filter.assignedTo = userId;
    } else if (role === 'project_manager' || role === 'manager') {
      filter.$or = [{ assignedTo: userId }, { createdBy: userId }];
    }

    const tasksArr = await Task.find(filter)
      .select('title blockedReason projectId')
      .populate('projectId', 'name')   // Project.name is the correct field
      .lean();

    const reasons = tasksArr.reduce((acc, t) => {
      const reason = t.blockedReason || 'Unknown';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

    return successResponse(res, {
      totalBlocked: tasksArr.length,
      reasons: Object.entries(reasons).map(([name, value]) => ({ name, value })),
      tasks: tasksArr.map(t => ({
        id: t._id,
        title: t.title,
        reason: t.blockedReason,
        project: t.projectId?.name || t.projectId?.projectTitle   // safe fallback
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

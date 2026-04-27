const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { successResponse, errorResponse } = require('../utils/helpers');

// GET /api/reports - Consolidated report
exports.getReports = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const orgFilter = req.orgFilter || { organizationId: req.user.organizationId };

    // Role-based project filter
    let projectFilter = { ...orgFilter };
    if (role !== 'admin' && role !== 'hr') {
      projectFilter.$or = [
        { owner: userId },
        { 'teamMembers.userId': userId },
      ];
    }

    const projects = await Project.find(projectFilter).lean();
    const projectIds = projects.map(p => p._id);

    // Fetch all tasks for these projects
    const tasks = await Task.find({ 
      organizationId: req.user.organizationId, 
      projectId: { $in: projectIds } 
    }).lean();

    console.log(`[REPORTS] Found ${projects.length} projects and ${tasks.length} tasks for org ${req.user.organizationId}`);

    const report = projects.map(project => {
      const projectTasks = tasks.filter(
        t => String(t.projectId) === String(project._id)
      );

      const total = projectTasks.length;

      // Status Normalization (matches Task model enums and potential legacy values)
      const isComplete = (t) => ['complete', 'completed', 'done'].includes(String(t.status).toLowerCase());
      const isInProgress = (t) => ['in_progress', 'active', 'in progress'].includes(String(t.status).toLowerCase());
      const isNotStarted = (t) => ['todo', 'backlog', 'not started'].includes(String(t.status).toLowerCase());

      const completed = projectTasks.filter(isComplete).length;
      const inProgress = projectTasks.filter(isInProgress).length;
      const notStarted = projectTasks.filter(isNotStarted).length;

      // Overdue: Not complete AND dueDate passed (ignoring time for simplicity)
      const now = new Date();
      const overdue = projectTasks.filter(t => {
        if (!t.dueDate || isComplete(t)) return false;
        return new Date(t.dueDate) < now;
      }).length;

      return {
        projectId: project._id,
        projectName: project.name || project.projectTitle || "Unnamed Project",
        total: total || 0,
        completed: completed || 0,
        inProgress: inProgress || 0,
        notStarted: notStarted || 0,
        overdue: overdue || 0,
        completion: total === 0 ? (project.completion || 0) : Math.round((completed / total) * 100)
      };
    });

    console.log("API Data (First item):", report[0] || "No Data");
    return successResponse(res, report, 'Reports fetched successfully');
  } catch (err) {
    console.error("[REPORTS ERROR]", err);
    return errorResponse(res, err.message, 500);
  }
};

// Specialized endpoints for cleaner frontend integration if needed
exports.getProjectsReport = async (req, res) => {
  // Use the same logic but return simplified array
  try {
    const orgFilter = req.orgFilter || { organizationId: req.user.organizationId };
    const projects = await Project.find(orgFilter).select('name projectTitle completion').lean();
    const data = projects.map(p => ({
      projectName: p.name || p.projectTitle || "Unnamed",
      completion: p.completion || 0
    }));
    return successResponse(res, data);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

exports.getProductivityReport = async (req, res) => {
  try {
    const orgFilter = req.orgFilter || { organizationId: req.user.organizationId };
    const tasks = await Task.find(orgFilter).lean();
    
    const completed = tasks.filter(t => ['complete', 'completed'].includes(t.status)).length;
    const inProgress = tasks.filter(t => ['in_progress', 'active'].includes(t.status)).length;
    const overdue = tasks.filter(t => {
      if (!t.dueDate || ['complete', 'completed'].includes(t.status)) return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    const data = [
      { name: "Completed", value: completed },
      { name: "In Progress", value: inProgress },
      { name: "Overdue", value: overdue }
    ];
    return successResponse(res, data);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

exports.getDelayReport = async (req, res) => {
  try {
    const orgFilter = req.orgFilter || { organizationId: req.user.organizationId };
    const tasks = await Task.find({ ...orgFilter, dueDate: { $ne: null } }).lean();
    const overdueTasks = tasks.filter(t => {
      if (['complete', 'completed'].includes(t.status)) return false;
      return new Date(t.dueDate) < new Date();
    });
    return successResponse(res, overdueTasks);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};


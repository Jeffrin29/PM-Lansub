const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { successResponse, errorResponse } = require('../utils/helpers');

// GET /api/reports - Consolidated report
exports.getReports = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const orgFilter = req.orgFilter || { organizationId: req.user.organizationId };

    // Role-scoped project filter
    let projectFilter = { ...orgFilter };
    if (role === 'project_manager' || role === 'manager') {
      projectFilter.$or = [
        { owner: userId },
        { 'teamMembers.userId': userId },
      ];
    }

    const projects = await Project.find(projectFilter);
    const projectIds = projects.map(p => p._id);
    
    // Fetch all tasks for these projects within the same organization
    const tasks = await Task.find({ ...orgFilter, projectId: { $in: projectIds } });

    const report = projects.map(project => {
      const projectTasks = tasks.filter(
        t => String(t.projectId) === String(project._id)
      );

      const total = projectTasks.length;

      // Status Normalization Check
      const isComplete = (t) => ['complete', 'completed'].includes(String(t.status).toLowerCase());
      const isInProgress = (t) => ['in_progress', 'in progress', 'active'].includes(String(t.status).toLowerCase());

      const completed = projectTasks.filter(isComplete).length;
      const inProgress = projectTasks.filter(isInProgress).length;
      const notStarted = projectTasks.filter(t => ['todo', 'backlog'].includes(String(t.status).toLowerCase())).length;

      const overdue = projectTasks.filter(t => {
        if (!t.dueDate || isComplete(t)) return false;
        return new Date(t.dueDate) < new Date();
      }).length;

      return {
        projectName: project.name || project.projectTitle,
        total,
        completed,
        inProgress,
        notStarted,
        overdue,
        completion:
          total === 0 ? (project.completion || 0) : Math.round((completed / total) * 100)
      };
    });

    return successResponse(res, report || [], 'Reports fetched successfully');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// Keeping old ones for backward compatibility if needed, but the user requested ONLY reports module work
exports.getProjectsReport = async (req, res) => { /* ... */ };
exports.getProductivityReport = async (req, res) => { /* ... */ };
exports.getDelayReport = async (req, res) => { /* ... */ };

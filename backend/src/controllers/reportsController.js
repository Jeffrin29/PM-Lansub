const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { successResponse, errorResponse } = require('../utils/helpers');

// GET /api/reports - Consolidated report
exports.getReports = async (req, res) => {
  try {
    const { organizationId, userId, role } = req.user;
    const orgId = new mongoose.Types.ObjectId(organizationId);

    // Role-scoped project filter
    let projectFilter = { organizationId: orgId };
    if (role === 'project_manager') {
      projectFilter.$or = [
        { owner: userId },
        { 'teamMembers.userId': userId },
      ];
    }

    const projects = await Project.find(projectFilter);
    const projectIds = projects.map(p => p._id);
    const tasks = await Task.find({ organizationId: orgId, projectId: { $in: projectIds } });

    const report = projects.map(project => {
      const projectTasks = tasks.filter(
        t => String(t.projectId) === String(project._id)
      );

      const total = projectTasks.length;

      const completed = projectTasks.filter(
        t => t.status === 'complete' || t.status === 'completed'
      ).length;

      const inProgress = projectTasks.filter(
        t => t.status === 'in_progress' || t.status === 'in progress'
      ).length;

      const notStarted = projectTasks.filter(
        t => t.status === 'todo'
      ).length;

      const overdue = projectTasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < new Date() && t.status !== 'complete';
      }).length;

      return {
        projectName: project.projectTitle,
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

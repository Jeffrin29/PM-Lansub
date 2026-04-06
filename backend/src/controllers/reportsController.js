const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/helpers');

// GET /api/reports/projects
const getProjectsReport = async (req, res) => {
  try {
    const { organizationId } = req.user;

    const userRole = req.user.role?.name?.toLowerCase();
    const isPrivileged = ['admin', 'hr', 'project_manager'].includes(userRole);

    let projectMatch = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    if (!isPrivileged) {
      projectMatch.$or = [
        { owner: new mongoose.Types.ObjectId(req.user.userId) },
        { 'teamMembers.userId': new mongoose.Types.ObjectId(req.user.userId) }
      ];
    }

    const data = await Project.aggregate([
      { $match: projectMatch },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'projectId',
          as: 'tasks',
        },
      },
      {
        $project: {
          project: '$projectTitle',
          completion: '$completionPercentage',
          status: 1,
          tasksCompleted: {
            $size: {
              $filter: {
                input: '$tasks',
                as: 'task',
                cond: { $eq: ['$$task.status', 'complete'] },
              },
            },
          },
          tasksRemaining: {
            $size: {
              $filter: {
                input: '$tasks',
                as: 'task',
                cond: { $ne: ['$$task.status', 'complete'] },
              },
            },
          },
        },
      },
    ]);

    return successResponse(res, data);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/reports/productivity
const getProductivityReport = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const now = new Date();

    const userRole = req.user.role?.name?.toLowerCase();
    const isPrivileged = ['admin', 'hr', 'project_manager'].includes(userRole);

    let taskMatch = { 
      organizationId: new mongoose.Types.ObjectId(organizationId),
      assignedTo: { $ne: null } 
    };

    if (!isPrivileged) {
      taskMatch.$or = [
        { assignedTo: new mongoose.Types.ObjectId(req.user.userId) },
        { createdBy: new mongoose.Types.ObjectId(req.user.userId) }
      ];
    }

    const data = await Task.aggregate([
      { $match: taskMatch },
      {
        $group: {
          _id: '$assignedTo',
          completed: { $sum: { $cond: [{ $eq: ['$status', 'complete'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'complete'] },
                    { $lt: ['$dueDate', now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalTimeMs: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'complete'] }, { $ne: ['$completedAt', null] }, { $ne: ['$createdAt', null] }] },
                { $subtract: ['$completedAt', '$createdAt'] },
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDoc',
        },
      },
      { $unwind: '$userDoc' },
      {
        $project: {
          _id: 0,
          user: '$userDoc.name',
          tasksCompleted: '$completed',
          overdueTasks: '$overdue',
          avgCompletionHours: {
            $cond: [
              { $gt: ['$completed', 0] },
              { $round: [{ $divide: ['$totalTimeMs', 3600000 * '$completed'] }, 0] },
              0,
            ],
          },
        },
      },
    ]);

    return successResponse(res, data);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/reports/delays
const getDelayReport = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const now = new Date();

    const userRole = req.user.role?.name?.toLowerCase();
    const isPrivileged = ['admin', 'hr', 'project_manager'].includes(userRole);

    let taskMatch = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      dueDate: { $ne: null },
    };

    if (!isPrivileged) {
      taskMatch.$or = [
        { assignedTo: new mongoose.Types.ObjectId(req.user.userId) },
        { createdBy: new mongoose.Types.ObjectId(req.user.userId) }
      ];
    }

    const data = await Task.aggregate([
      { $match: taskMatch },
      {
        $project: {
          task: '$title',
          status: 1,
          expectedDate: '$dueDate',
          actualDate: { $cond: [{ $eq: ['$status', 'complete'] }, '$completedAt', null] },
          delayDays: {
            $let: {
              vars: {
                actual: { $ifNull: ['$completedAt', now] },
              },
              in: {
                $cond: [
                  { $gt: ['$$actual', '$dueDate'] },
                  { $ceil: { $divide: [{ $subtract: ['$$actual', '$dueDate'] }, 86400000] } },
                  0,
                ],
              },
            },
          },
        },
      },
    ]);

    return successResponse(res, data);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = { getProjectsReport, getProductivityReport, getDelayReport };

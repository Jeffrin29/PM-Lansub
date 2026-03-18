const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/helpers');

// GET /api/reports/projects
const getProjectsReport = async (req, res) => {
  try {
    const { organizationId } = req.user;

    const data = await Project.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
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
                cond: { $eq: ['$$task.status', 'done'] },
              },
            },
          },
          tasksRemaining: {
            $size: {
              $filter: {
                input: '$tasks',
                as: 'task',
                cond: { $ne: ['$$task.status', 'done'] },
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

    const data = await Task.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), assignee: { $ne: null } } },
      {
        $group: {
          _id: '$assignee',
          completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'done'] },
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
                { $and: [{ $eq: ['$status', 'done'] }, { $ne: ['$completedAt', null] }, { $ne: ['$createdAt', null] }] },
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

    const data = await Task.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          dueDate: { $ne: null },
        },
      },
      {
        $project: {
          task: '$title',
          status: 1,
          expectedDate: '$dueDate',
          actualDate: { $cond: [{ $eq: ['$status', 'done'] }, '$completedAt', null] },
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

'use strict';
const Discussion = require('../models/Discussion');
const Comment = require('../models/Comment');
const { logActivity } = require('../services/activityService');
const { sendNotification } = require('../services/notificationService');
const { successResponse, errorResponse, getPagination, paginatedResponse } = require('../utils/helpers');

// GET /api/discussions
const getDiscussions = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { ...req.orgFilter };
    if (req.query.projectId) filter.projectId = req.query.projectId;

    const [discussions, total] = await Promise.all([
      Discussion.find(filter)
        .sort({ isPinned: -1, lastActivityAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email')
        .populate('projectId', 'name')
        .select('-comments')
        .lean(),
      Discussion.countDocuments(filter),
    ]);

    const data = (discussions || []).map((d) => ({
      ...d,
      replyCount: d.comments?.length || 0,
    }));

    return successResponse(res, paginatedResponse(data, total, page, limit));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// POST /api/discussions
const createDiscussion = async (req, res) => {
  try {
    const { topic, projectId, description, tags, meetingLink } = req.body;
    const { userId, organizationId } = req.user;

    const discussion = await Discussion.create({
      topic,
      projectId: projectId || null,
      organizationId,
      author: userId,
      description: description || '',
      tags: tags || [],
      createdBy: userId,
      meetingLink: meetingLink || "",
    });

    // ✅ LOG ACTIVITY
    await logActivity({
      userId: userId,
      organizationId,
      action: 'discussion:created',
      entityType: 'discussion',
      entityId: discussion._id,
      metadata: { topic: discussion.topic }
    });

    // ✅ TRIGGER NOTIFICATION
    if (meetingLink) {
      await sendNotification({
        userId: userId,
        organizationId,
        title: 'New Meeting Scheduled',
        message: `A meeting was scheduled for topic: ${topic}`,
        type: 'meeting',
        link: { type: 'project', id: projectId, url: meetingLink }
      });
    }

    return successResponse(res, discussion, 'Discussion created', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/discussions/:id
const getDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findOne({ _id: req.params.id, ...req.orgFilter })
      .populate('author', 'name email')
      .populate('comments.author', 'name email')
      .populate('projectId', 'name')
      .lean();

    if (!discussion) return errorResponse(res, 'Discussion not found', 404);
    return successResponse(res, discussion);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// POST /api/discussions/:id/comments
const addComment = async (req, res) => {
  try {
    const { content, mentions } = req.body;
    const { userId, organizationId, name } = req.user;

    const discussion = await Discussion.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!discussion) return errorResponse(res, 'Discussion not found', 404);

    discussion.comments.push({
      author: userId,
      content,
      mentions: mentions || [],
    });
    discussion.lastActivityAt = new Date();
    await discussion.save();

    // Create in global Comment collection
    await Comment.create({
      text: content,
      user: userId,
      projectId: discussion.projectId,
      organizationId: organizationId
    });

    // ✅ LOG ACTIVITY
    await logActivity({
      userId: userId,
      organizationId,
      action: 'discussion:replied',
      entityType: 'discussion',
      entityId: discussion._id,
    });

    // ✅ TRIGGER NOTIFICATION
    if (discussion.author.toString() !== userId) {
      await sendNotification({
        userId: discussion.author,
        organizationId,
        title: 'New Reply Received',
        message: `${name || 'Someone'} replied to your discussion: ${discussion.topic}`,
        type: 'discussion_replied',
        link: { type: 'discussion', id: discussion._id }
      });
    }

    await discussion.populate('comments.author', 'name email');
    const newComment = discussion.comments[discussion.comments.length - 1];

    return successResponse(res, newComment, 'Comment added', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/discussions/comments/latest
const getLatestComments = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const discussions = await Discussion.find({ ...req.orgFilter, 'comments.0': { $exists: true } })
      .sort({ lastActivityAt: -1 })
      .limit(limit)
      .populate('comments.author', 'name email')
      .populate('projectId', 'name')
      .select('topic comments projectId')
      .lean();

    const comments = [];
    for (const d of discussions) {
      if (d.comments && d.comments.length > 0) {
        const last = d.comments[d.comments.length - 1];
        comments.push({
          discussionId: d._id,
          topic: d.topic,
          project: d.projectId?.name || d.projectId?.projectTitle || null,
          comment: last,
        });
      }
    }

    return successResponse(res, comments.slice(0, limit));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = { getDiscussions, createDiscussion, getDiscussion, addComment, getLatestComments };

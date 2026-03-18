'use strict';
const Discussion = require('../models/Discussion');
const { successResponse, errorResponse, getPagination, paginatedResponse } = require('../utils/helpers');

// GET /api/discussions
const getDiscussions = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { page, limit, skip } = getPagination(req.query);
    const filter = { organizationId };
    if (req.query.projectId) filter.projectId = req.query.projectId;

    const [discussions, total] = await Promise.all([
      Discussion.find(filter)
        .sort({ isPinned: -1, lastActivityAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email')
        .populate('projectId', 'projectTitle')
        .select('-comments')
        .lean(),
      Discussion.countDocuments(filter),
    ]);

    const data = discussions.map((d) => ({
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
    const { organizationId } = req.user;
    const { topic, projectId, description, tags } = req.body;

    const discussion = await Discussion.create({
      topic,
      projectId: projectId || null,
      organizationId,
      author: req.user._id,
      description: description || '',
      tags: tags || [],
      createdBy: req.user._id,
    });

    return successResponse(res, discussion, 'Discussion created', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// GET /api/discussions/:id
const getDiscussion = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const discussion = await Discussion.findOne({ _id: req.params.id, organizationId })
      .populate('author', 'name email')
      .populate('comments.author', 'name email')
      .populate('projectId', 'projectTitle')
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
    const { organizationId } = req.user;
    const { content, mentions } = req.body;

    const discussion = await Discussion.findOne({ _id: req.params.id, organizationId });
    if (!discussion) return errorResponse(res, 'Discussion not found', 404);

    discussion.comments.push({
      author: req.user._id,
      content,
      mentions: mentions || [],
    });
    discussion.lastActivityAt = new Date();
    await discussion.save();

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
    const { organizationId } = req.user;
    const limit = parseInt(req.query.limit, 10) || 10;

    const discussions = await Discussion.find({ organizationId, 'comments.0': { $exists: true } })
      .sort({ lastActivityAt: -1 })
      .limit(limit)
      .populate('comments.author', 'name email')
      .populate('projectId', 'projectTitle')
      .select('topic comments projectId')
      .lean();

    const comments = [];
    for (const d of discussions) {
      if (d.comments && d.comments.length > 0) {
        const last = d.comments[d.comments.length - 1];
        comments.push({
          discussionId: d._id,
          topic: d.topic,
          project: d.projectId?.projectTitle || null,
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

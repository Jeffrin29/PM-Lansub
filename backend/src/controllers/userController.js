const User = require('../models/User');
const Role = require('../models/Role');
const { successResponse, errorResponse, getPagination, paginatedResponse, getClientIp } = require('../utils/helpers');
const { createAuditLog } = require('../utils/auditLog');

// ─── List Users (with pagination, search, filter) ────────────────────────────
exports.getUsers = async (req, res, next) => {
  try {
    const { skip, limit, page, sort } = getPagination(req.query);
    const { search, status, roleId } = req.query;

    const filter = { ...req.orgFilter };
    if (status) filter.status = status;
    if (roleId) filter.roleId = roleId;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('roleId', 'name displayName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return successResponse(res, paginatedResponse(users, total, page, limit), 'Users fetched.');
  } catch (err) {
    next(err);
  }
};

// ─── Get Single User ─────────────────────────────────────────────────────────
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, ...req.orgFilter })
      .populate('roleId', 'name displayName level')
      .lean();

    if (!user) return errorResponse(res, 'User not found.', 404);
    return successResponse(res, user, 'User fetched.');
  } catch (err) {
    next(err);
  }
};

// ─── Create User ──────────────────────────────────────────────────────────────
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, roleId, status } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return errorResponse(res, 'Email already in use.', 409);

    const role = await Role.findOne({ _id: roleId, organizationId: req.user.organizationId });
    if (!role) return errorResponse(res, 'Invalid role for this organization.', 400);

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      organizationId: req.user.organizationId,
      roleId,
      status: status || 'active',
      invitedBy: req.user.userId,
    });

    await createAuditLog({
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      action: 'CREATE_USER',
      entityType: 'user',
      entityId: user._id,
      description: `User created: ${email}`,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    return successResponse(res, user, 'User created.', 201);
  } catch (err) {
    next(err);
  }
};

// ─── Update User ──────────────────────────────────────────────────────────────
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, roleId, status, phone, timezone, preferences } = req.body;

    const user = await User.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!user) return errorResponse(res, 'User not found.', 404);

    if (roleId) {
      const role = await Role.findOne({ _id: roleId, organizationId: req.user.organizationId });
      if (!role) return errorResponse(res, 'Invalid role for this organization.', 400);
    }

    const before = { name: user.name, email: user.email, roleId: user.roleId, status: user.status };

    if (name) user.name = name;
    if (email) user.email = email;
    if (roleId) user.roleId = roleId;
    if (status) user.status = status;
    if (phone !== undefined) user.phone = phone;
    if (timezone) user.timezone = timezone;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    await createAuditLog({
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      action: 'UPDATE_USER',
      entityType: 'user',
      entityId: user._id,
      description: `User updated: ${user.email}`,
      changes: { before, after: { name: user.name, email: user.email, roleId: user.roleId, status: user.status } },
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    return successResponse(res, user, 'User updated.');
  } catch (err) {
    next(err);
  }
};

// ─── Delete User ──────────────────────────────────────────────────────────────
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, ...req.orgFilter });
    if (!user) return errorResponse(res, 'User not found.', 404);

    // Prevent self-deletion
    if (user._id.toString() === req.user.userId) {
      return errorResponse(res, 'You cannot delete your own account.', 400);
    }

    await user.deleteOne();

    await createAuditLog({
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      action: 'DELETE_USER',
      entityType: 'user',
      entityId: user._id,
      description: `User deleted: ${user.email}`,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    return successResponse(res, null, 'User deleted.');
  } catch (err) {
    next(err);
  }
};

// ─── Get User Sessions ────────────────────────────────────────────────────────
exports.getUserSessions = async (req, res, next) => {
  try {
    const Session = require('../models/Session');
    const sessions = await Session.find({
      userId: req.params.id,
      ...req.orgFilter,
    }).sort({ createdAt: -1 }).lean();

    return successResponse(res, sessions, 'Sessions fetched.');
  } catch (err) {
    next(err);
  }
};

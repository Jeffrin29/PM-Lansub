const User = require('../models/User');
const Organization = require('../models/Organization');
const Role = require('../models/Role');
const Session = require('../models/Session');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { signAccessToken, signRefreshToken, verifyRefreshToken, getRefreshTokenExpiry } = require('../utils/jwt');
const { successResponse, errorResponse, getClientIp, parseUserAgent, generateToken } = require('../utils/helpers');
const { createAuditLog } = require('../utils/auditLog');

// ─── Helper: resolve canonical role name ────────────────────────────────────────
const resolveRole = (user) => {
  if (user.roleId && typeof user.roleId === 'object' && user.roleId.name) {
    const raw = user.roleId.name.toLowerCase();
    return (raw === 'org_admin' || raw === 'super_admin') ? 'admin' : raw;
  }

  const legacyRole = (user.role || 'employee').toLowerCase();
  return (legacyRole === 'org_admin' || legacyRole === 'super_admin') ? 'admin' : legacyRole;
};

// ─── Helper: build auth response payload ────────────────────────────────────────
const buildTokens = (user) => {
  if (!user || !user._id) {
    throw new Error("Invalid user");
  }

  if (!user.roleId || !user.roleId.name) {
    throw new Error("Missing role");
  }

  const payload = {
    userId: user._id.toString(),
    role: user.roleId.name.toLowerCase(),
    organizationId: user.organizationId ? user.organizationId.toString() : null
  };

  console.log("Building Token Payload:", payload);

  return jwt.sign(payload, process.env.JWT_SECRET || "secret");
};
// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, organizationName } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'An account with this email already exists.', 409);
    }

    // Create organization if name provided, else use personal org
    let org = await Organization.findOne({ name: organizationName || `${name}'s Organization` });
    if (!org) {
      org = await Organization.create({
        name: organizationName || `${name}'s Organization`,
        plan: 'free',
      });
    }

    // Create default org_admin role for the first user
    let adminRole = await Role.findOne({ name: 'org_admin', organizationId: org._id });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'org_admin',
        displayName: 'Organization Admin',
        description: 'Full access to organization resources',
        organizationId: org._id,
        permissions: [],
        isSystemRole: true,
        level: 90,
      });
    }

    // Create user (password hashed via pre-save hook)
    const user = await User.create({
      name,
      email,
      passwordHash: password,
      organizationId: org._id,
      roleId: adminRole._id,
      role: 'admin',
      status: 'active',
      emailVerified: false,
    });

    const HrEmployee = require("../models/HrEmployee");
    // After creating user

    await HrEmployee.create({
      organizationId: user.organizationId,
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "Employee",
      department: "General",
      status: "active",
    });

    // Update org createdBy
    if (!org.createdBy) {
      org.createdBy = user._id;
      await org.save();
    }

    // Get populated user for tokens
    const populatedUser = await User.findById(user._id).populate('roleId');
    const token = buildTokens(populatedUser);

    const ip = getClientIp(req);
    const { device, browser, os } = parseUserAgent(req.headers['user-agent']);

    populatedUser.lastLogin = new Date();
    populatedUser.lastLoginIp = ip;
    await populatedUser.save();

    // Create session (optional if refresh tokens are being removed, but keeping for compatibility)
    await Session.create({
      userId: user._id,
      organizationId: org._id,
      device,
      browser,
      os,
      ipAddress: ip,
      userAgent: req.headers['user-agent'],
      loginTime: new Date(),
      lastActiveAt: new Date(),
      active: true,
    });

    await createAuditLog({
      userId: user._id,
      organizationId: org._id,
      action: 'REGISTER',
      entityType: 'auth',
      entityId: user._id,
      description: `New user registered: ${email}`,
      ipAddress: ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      token,
      user: {
        id: populatedUser._id,
        email: populatedUser.email,
        role: populatedUser.roleId.name
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt:", email);

    // IMPORTANT: select +passwordHash to allow bcrypt comparison
    const user = await User.findOne({ email })
      .select("+passwordHash")
      .populate("roleId");

    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({ message: "Invalid email" });
    }

    if (!user.passwordHash) {
      console.error("Missing passwordHash for user:", email);
      return res.status(500).json({ message: "Password not set" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      console.log("Password mismatch for user:", email);
      return res.status(401).json({ message: "Invalid password" });
    }

    if (!user.roleId) {
      console.error("User roleId missing:", email);
      return res.status(500).json({ message: "User role missing" });
    }

    if (!user.roleId.name) {
      console.error("Role name missing for user:", email);
      return res.status(500).json({ message: "Role name missing" });
    }

    console.log("User found for login:", user.email, "Org ID:", user.organizationId);

    if (!user.organizationId) {
      console.error("CRITICAL: organizationId missing for user:", email);
      return res.status(500).json({ message: "Account configuration error: organizationId missing" });
    }

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.roleId.name.toLowerCase(),
      organizationId: user.organizationId.toString()
    };

    console.log("Signing Login JWT with Payload:", payload);

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.roleId.name,
        organizationId: user.organizationId
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR FULL:", error); // IMPORTANT
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.userId;

    if (refreshToken) {
      const user = await User.findById(userId).select('+refreshTokens');
      if (user) {
        user.removeRefreshToken(refreshToken);
        await user.save();
      }
      // Deactivate session
      await Session.findOneAndUpdate(
        { userId, refreshToken },
        { active: false, logoutTime: new Date() }
      );
    }

    await createAuditLog({
      userId,
      organizationId: req.user.organizationId,
      action: 'LOGOUT',
      entityType: 'auth',
      entityId: userId,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    return successResponse(res, null, 'Logged out successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return errorResponse(res, 'Invalid or expired refresh token.', 401);
    }

    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user) return errorResponse(res, 'User not found.', 401);

    if (!user.isRefreshTokenValid(refreshToken)) {
      return errorResponse(res, 'Refresh token is no longer valid. Please log in again.', 401);
    }

    if (user.status !== 'active') {
      return errorResponse(res, 'Account is not active.', 403);
    }

    // Issue new token
    const populatedUser = await User.findById(user._id).populate('roleId');
    const token = buildTokens(populatedUser);

    // Update session
    await Session.findOneAndUpdate(
      { userId: user._id, refreshToken },
      { lastActiveAt: new Date() }
    );

    return res.status(200).json({
      token,
      user: {
        id: populatedUser._id,
        email: populatedUser.email,
        role: populatedUser.roleId.name
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success (prevent user enumeration)
    if (!user) {
      return successResponse(res, null, 'If that email exists, a reset link has been sent.');
    }

    const resetToken = generateToken(32);
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // In production: send email with resetToken
    // await emailService.sendPasswordReset(user.email, resetToken);

    await createAuditLog({
      userId: user._id,
      organizationId: user.organizationId,
      action: 'PASSWORD_RESET_REQUEST',
      entityType: 'auth',
      entityId: user._id,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    return successResponse(
      res,
      process.env.NODE_ENV === 'development' ? { resetToken } : null,
      'If that email exists, a reset link has been sent.'
    );
  } catch (err) {
    next(err);
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires +refreshTokens');

    if (!user) {
      return errorResponse(res, 'Reset token is invalid or has expired.', 400);
    }

    user.passwordHash = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.removeAllRefreshTokens(); // Invalidate all sessions
    await user.save();

    // Deactivate all sessions
    await Session.updateMany({ userId: user._id, active: true }, { active: false, logoutTime: new Date() });

    await createAuditLog({
      userId: user._id,
      organizationId: user.organizationId,
      action: 'PASSWORD_RESET',
      entityType: 'auth',
      entityId: user._id,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    return successResponse(res, null, 'Password reset successfully. Please log in.');
  } catch (err) {
    next(err);
  }
};

// ─── Get current user (me) ────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('organizationId', 'name plan status settings')
      .populate('roleId', 'name displayName level permissions');

    if (!user) return errorResponse(res, 'User not found.', 404);
    return successResponse(res, user, 'Profile fetched.');
  } catch (err) {
    next(err);
  }
};

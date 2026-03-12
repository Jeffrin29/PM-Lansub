const User = require('../models/User');
const Organization = require('../models/Organization');
const Role = require('../models/Role');
const Session = require('../models/Session');
const { signAccessToken, signRefreshToken, verifyRefreshToken, getRefreshTokenExpiry } = require('../utils/jwt');
const { successResponse, errorResponse, getClientIp, parseUserAgent, generateToken } = require('../utils/helpers');
const { createAuditLog } = require('../utils/auditLog');

// ─── Helper: build auth response payload ────────────────────────────────────────
const buildTokens = (user) => {
  const payload = {
    userId: user._id.toString(),
    organizationId: user.organizationId.toString(),
    roleId: user.roleId?.toString() || user.roleId,
  };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
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
      status: 'active',
      emailVerified: false,
    });

    // Update org createdBy
    if (!org.createdBy) {
      org.createdBy = user._id;
      await org.save();
    }

    const { accessToken, refreshToken } = buildTokens(user);
    const ip = getClientIp(req);
    const { device, browser, os } = parseUserAgent(req.headers['user-agent']);
    const expiresAt = getRefreshTokenExpiry();

    // Store refresh token on user
    const freshUser = await User.findById(user._id).select('+refreshTokens');
    freshUser.addRefreshToken(refreshToken, device, expiresAt);
    freshUser.lastLogin = new Date();
    freshUser.lastLoginIp = ip;
    await freshUser.save();

    // Create session
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
      refreshToken,
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

    return successResponse(
      res,
      {
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          organizationId: org._id,
          roleId: adminRole._id,
          status: user.status,
        },
        organization: { _id: org._id, name: org.name, plan: org.plan },
      },
      'Registration successful.',
      201
    );
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = getClientIp(req);

    const user = await User.findOne({ email })
      .select('+passwordHash +refreshTokens')
      .populate('roleId', 'name displayName level isSystemRole');

    if (!user) {
      await createAuditLog({
        action: 'LOGIN_FAILED',
        entityType: 'auth',
        description: `Failed login attempt for email: ${email}`,
        ipAddress: ip,
        userAgent: req.headers['user-agent'],
        status: 'failure',
      });
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await createAuditLog({
        userId: user._id,
        organizationId: user.organizationId,
        action: 'LOGIN_FAILED',
        entityType: 'auth',
        entityId: user._id,
        description: `Incorrect password for: ${email}`,
        ipAddress: ip,
        userAgent: req.headers['user-agent'],
        status: 'failure',
      });
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    if (user.status !== 'active') {
      return errorResponse(res, `Account is ${user.status}. Contact your administrator.`, 403);
    }

    const { accessToken, refreshToken } = buildTokens(user);
    const { device, browser, os } = parseUserAgent(req.headers['user-agent']);
    const expiresAt = getRefreshTokenExpiry();

    user.addRefreshToken(refreshToken, device, expiresAt);
    user.lastLogin = new Date();
    user.lastLoginIp = ip;
    await user.save();

    await Session.create({
      userId: user._id,
      organizationId: user.organizationId,
      device,
      browser,
      os,
      ipAddress: ip,
      userAgent: req.headers['user-agent'],
      loginTime: new Date(),
      lastActiveAt: new Date(),
      refreshToken,
      active: true,
    });

    await createAuditLog({
      userId: user._id,
      organizationId: user.organizationId,
      action: 'LOGIN',
      entityType: 'auth',
      entityId: user._id,
      description: `User logged in: ${email}`,
      ipAddress: ip,
      userAgent: req.headers['user-agent'],
    });

    return successResponse(res, {
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        organizationId: user.organizationId,
        role: user.roleId,
        status: user.status,
        lastLogin: user.lastLogin,
      },
    }, 'Login successful.');
  } catch (err) {
    next(err);
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

    // Rotate: remove old, issue new
    user.removeRefreshToken(refreshToken);
    const { device, browser } = parseUserAgent(req.headers['user-agent']);
    const expiresAt = getRefreshTokenExpiry();
    const { accessToken, refreshToken: newRefreshToken } = buildTokens(user);
    user.addRefreshToken(newRefreshToken, device, expiresAt);
    await user.save();

    // Update session
    await Session.findOneAndUpdate(
      { userId: user._id, refreshToken },
      { refreshToken: newRefreshToken, lastActiveAt: new Date() }
    );

    return successResponse(res, { accessToken, refreshToken: newRefreshToken }, 'Tokens refreshed.');
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

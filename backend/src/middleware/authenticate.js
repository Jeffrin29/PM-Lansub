const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const { errorResponse } = require('../utils/helpers');

/**
 * Protect routes — validates Bearer JWT access token and attaches user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required. Please provide a valid token.', 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Access token has expired. Please refresh your token.', 401);
      }
      return errorResponse(res, 'Invalid access token.', 401);
    }

    const user = await User.findById(decoded.userId)
      .select('+passwordHash')
      .populate('roleId', 'name displayName level permissions isSystemRole')
      .lean({ virtuals: false });

    if (!user) {
      return errorResponse(res, 'User account not found.', 401);
    }

    if (user.status !== 'active') {
      return errorResponse(res, `Account is ${user.status}. Please contact your administrator.`, 403);
    }

    // Attach user info to request
    req.user = {
      _id: user._id,
      id: user._id.toString(), // Added id as requested
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      organizationId: user.organizationId.toString(),
      roleId: user.roleId?._id?.toString(),
      role: (user.role || (user.roleId && user.roleId.name) || 'employee').toLowerCase(),
      status: user.status,
    };

    next();
  } catch (err) {
    return errorResponse(res, 'Authentication failed.', 500);
  }
};

/**
 * Optional authentication — populates req.user if token is present, doesn't block if absent
 */
const optionalAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return authenticate(req, res, next);
};

module.exports = { authenticate, optionalAuthenticate };

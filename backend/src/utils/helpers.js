const config = require('../config/config');

/**
 * Build a standard paginated query object
 * @param {Object} query  - req.query
 * @returns {{ skip, limit, page, sort }}
 */
const getPagination = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || config.pagination.defaultPage);
  const limit = Math.min(
    config.pagination.maxLimit,
    Math.max(1, parseInt(query.limit, 10) || config.pagination.defaultLimit)
  );
  const skip = (page - 1) * limit;

  // Allow ?sort=createdAt&order=desc
  const sortField = query.sort || 'createdAt';
  const sortOrder = query.order === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortOrder };

  return { skip, limit, page, sort };
};

/**
 * Build standard paginated API response
 */
const paginatedResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
  },
});

/**
 * Standard success response
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standard error response
 */
const errorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

/**
 * Extract client IP from request (accounting for proxies)
 */
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    '0.0.0.0'
  );
};

/**
 * Parse user-agent string into { browser, os, device }
 */
const parseUserAgent = (ua = '') => {
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE)[\/\s][\d.]+/i)?.[0] || 'Unknown Browser';
  const os = ua.match(/(Windows NT|Mac OS X|Linux|Android|iOS)[\/\s]?[\d._]*/i)?.[0] || 'Unknown OS';
  const device = /mobile/i.test(ua) ? 'Mobile' : /tablet/i.test(ua) ? 'Tablet' : 'Desktop';
  return { browser, os, device };
};

/**
 * Convert string to slug
 */
const toSlug = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Generate a unique token (URL-safe)
 */
const generateToken = (length = 32) => {
  const { randomBytes } = require('crypto');
  return randomBytes(length).toString('hex');
};

module.exports = {
  getPagination,
  paginatedResponse,
  successResponse,
  errorResponse,
  getClientIp,
  parseUserAgent,
  toSlug,
  generateToken,
};

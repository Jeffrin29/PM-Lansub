const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Sign a JWT access token
 */
const signAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
    issuer: 'pm-lan',
    audience: 'pm-lan-client',
  });
};

/**
 * Sign a JWT refresh token
 */
const signRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
    issuer: 'pm-lan',
    audience: 'pm-lan-client',
  });
};

/**
 * Verify a JWT access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret, {
    issuer: 'pm-lan',
    audience: 'pm-lan-client',
  });
};

/**
 * Verify a JWT refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret, {
    issuer: 'pm-lan',
    audience: 'pm-lan-client',
  });
};

/**
 * Decode a token without verifying (for extracting expiry info)
 */
const decodeToken = (token) => jwt.decode(token);

/**
 * Calculate token expiry date from seconds-offset (parsed from config string like "7d")
 */
const getRefreshTokenExpiry = () => {
  const raw = config.jwt.refreshExpires; // e.g. "7d", "24h", "3600"
  const match = raw.match(/^(\d+)([smhd]?)$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const value = parseInt(match[1], 10);
  const unit = match[2] || 's';
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return new Date(Date.now() + value * (multipliers[unit] || 1000));
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getRefreshTokenExpiry,
};

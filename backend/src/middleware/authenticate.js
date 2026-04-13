const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Standardized JWT authentication middleware
 * Populates req.user from DB to ensure role and organization are always current.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "secret";
    
    const decoded = jwt.verify(token, secret);
    console.log("Decoded JWT:", decoded);
    console.log("Org ID from Token:", decoded.organizationId);
    
    // Always fetch fresh user from DB to ensure role/org consistency
    // Standardize to userId, organizationId, and role (from roleId.name)
    const user = await User.findById(decoded.userId).populate("roleId");
    
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (!user.roleId || !user.roleId.name) {
      return res.status(500).json({ message: "User role configuration error" });
    }

    // Attach standardized user object
    req.user = {
      _id: user._id,
      userId: user._id.toString(),
      role: user.roleId.name.toLowerCase(),
      organizationId: user.organizationId ? user.organizationId.toString() : null,
      email: user.email,
      name: user.name
    };

    // Safety check: ensure organizationId exists
    if (!req.user.organizationId) {
      console.error("Organization context is missing for user:", user.email);
      return res.status(403).json({
        message: "Organization context is missing"
      });
    }

    // Also attach organizationId directly for convenience (used by some middleware)
    req.organizationId = req.user.organizationId;

    next();
  } catch (err) {
    console.error("JWT AUTH ERROR:", err.message);
    return res.status(401).json({ message: "Invalid or expired access token" });
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

module.exports = {
  authenticate,
  optionalAuthenticate
};

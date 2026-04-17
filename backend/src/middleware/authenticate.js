const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Standardized JWT authentication middleware
 * Populates req.user from DB to ensure role and organization are always current.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const headerOrgId = req.headers['x-organization-id'];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "secret";
    
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      console.error("JWT Verify Fail:", err.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    console.log("--- AUTH DEBUG ---");
    console.log("Decoded User ID:", decoded.userId);
    console.log("Decoded Org ID:", decoded.organizationId);
    
    const user = await User.findById(decoded.userId).populate("roleId");
    
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // Role Normalization: "Project Manager" -> "project_manager"
    let rawRole = 'employee';
    if (user.roleId && user.roleId.name) {
      rawRole = user.roleId.name;
    } else if (user.role) {
      rawRole = user.role;
    }
    const normalizedRole = rawRole.toLowerCase().trim().replace(/\s+/g, '_');

    // Organization ID normalization
    const organizationId = (user.organizationId || decoded.organizationId || headerOrgId)?.toString();

    // Attach standardized user object
    req.user = {
      _id: user._id,
      id: user._id.toString(),
      userId: user._id.toString(),
      role: normalizedRole,
      organizationId: organizationId,
      email: user.email,
      name: user.name
    };

    console.log("Normalized Role:", req.user.role);
    console.log("Active OrgId:", req.user.organizationId);

    if (!req.user.organizationId) {
      console.error("Organization context missing for:", user.email);
      return res.status(403).json({ message: "Organization context is missing" });
    }

    req.organizationId = req.user.organizationId;
    next();
  } catch (err) {
    console.error("JWT AUTH ERROR:", err);
    return res.status(401).json({ message: "Authentication failed" });
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

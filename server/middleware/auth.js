const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "familyvault_default_secret_key";

// Middleware: Strict Authentication Required (Must be logged in)
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication token missing or invalid format" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user in MongoDB by ID (decoded.id)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }

    if (!user.approved) {
      return res.status(403).json({ message: "Account is pending approval" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    res.status(401).json({ message: "Invalid or expired session token" });
  }
};

// Middleware: Optional Authentication (Used for public timelines/feeds)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const user = await User.findById(decoded.id).select("-password");
      if (user && user.approved) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Silent fail in optional auth, proceed as guest
    next();
  }
};

// Middleware: Admin Role Required
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access privileges required" });
  }
  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin
};

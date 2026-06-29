const jwt = require("jsonwebtoken");
const User = require("../models/User");
let admin;

// Try to initialize firebase-admin if service account env is set
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const adminSdk = require("firebase-admin");
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT);
    adminSdk.initializeApp({
      credential: adminSdk.credential.cert(serviceAccount)
    });
    admin = adminSdk;
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (err) {
    console.warn("Could not load Firebase Service Account. Falling back to JWT decoding mode.", err.message);
  }
}

// Main auth verification helper
const verifyToken = async (token) => {
  if (admin && process.env.USE_MOCK_AUTH !== "true") {
    // Production/Secure: Verify token using Firebase Admin SDK
    return await admin.auth().verifyIdToken(token);
  } else {
    // Development/Mock: Decode JWT without signature verification for easier local setup
    const decoded = jwt.decode(token);
    if (!decoded) throw new Error("Invalid JWT token format");
    return {
      uid: decoded.sub || decoded.uid || decoded.user_id,
      email: decoded.email,
      name: decoded.name || decoded.email?.split("@")[0] || "User",
      picture: decoded.picture || ""
    };
  }
};

// Middleware: Strict Authentication Required (Must be logged in and APPROVED)
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication token missing or invalid format" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);

    // Find user in MongoDB
    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      return res.status(404).json({ message: "User profile not found. Please sync registration." });
    }

    if (!user.approved) {
      return res.status(403).json({ message: "Pending admin approval. You cannot access family photos yet." });
    }

    req.user = user;
    req.firebaseUser = decoded;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    res.status(401).json({ message: "Invalid or expired authentication token" });
  }
};

// Middleware: Optional Authentication (Used for public feeds where auth users get more access)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = await verifyToken(token);
      
      const user = await User.findOne({ firebaseUid: decoded.uid });
      if (user && user.approved) {
        req.user = user;
        req.firebaseUser = decoded;
      }
    }
    next();
  } catch (error) {
    // Silent fail in optional auth, proceed as guest
    next();
  }
};

// Middleware: Firebase Token verification only (for registration syncing)
const requireFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication token missing or invalid format" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);
    req.firebaseUser = decoded;
    next();
  } catch (error) {
    console.error("Firebase Token Verification Error:", error.message);
    res.status(401).json({ message: "Invalid or expired authentication token" });
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
  requireFirebaseToken,
  requireAdmin
};


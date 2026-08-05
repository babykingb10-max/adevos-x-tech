const jwt = require("jsonwebtoken");
const { User } = require("../models");

// Verifies the user JWT (from cookie or Authorization header) and attaches req.user
async function protect(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.isBlocked) return res.status(403).json({ message: "Account blocked" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Requires req.user.role === "admin" (used AFTER protect on admin-only routes)
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Does not fail if unauthenticated — just attaches req.user when a valid token exists
async function optionalAuth(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (user && !user.isBlocked) req.user = user;
    next();
  } catch (err) {
    next();
  }
}

module.exports = { protect, adminOnly, optionalAuth };

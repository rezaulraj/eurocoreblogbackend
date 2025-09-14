import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  try {
    // Accept different header formats (Authorization, authorization, bearer)
    const authHeader =
      req.headers["authorization"] ||
      req.headers["Authorization"] ||
      req.headers["bearer"];

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Remove "Bearer " prefix if present
    const token = authHeader.replace(/Bearer\s+/i, "");

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "c12f955daca7ed5976b8b2db"
    );

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};

// 🔒 Only Admin
const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin required." });
  }
  next();
};

// ✍️ Author or Admin
const authorAuth = (req, res, next) => {
  if (!req.user || !["admin", "author"].includes(req.user.role)) {
    return res
      .status(403)
      .json({ message: "Access denied. Author or admin required." });
  }
  next();
};

export { auth, adminAuth, authorAuth };

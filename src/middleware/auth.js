// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  try {
    const authHeader =
      req.headers["authorization"] ||
      req.headers["Authorization"] ||
      req.headers["bearer"];

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.replace(/Bearer\s+/i, "").trim();

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "c12f955daca7ed5976b8b2db",
    );

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

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
    return res.status(401).json({ message: "Token is not valid" });
  }
};

const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin required." });
  }
  next();
};

const authorAuth = (req, res, next) => {
  if (!req.user || !["admin", "author"].includes(req.user.role)) {
    return res
      .status(403)
      .json({ message: "Access denied. Author or admin required." });
  }
  next();
};

export { auth, adminAuth, authorAuth };

import express from "express";
import { auth, adminAuth } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put("/profile", auth, async (req, res) => {
  try {
    const { username, email, bio, avatar } = req.body;

    const user = await User.findById(req.user.id);

    if (username) user.username = username;
    if (email) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
router.get("/", auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Toggle user active status (Admin only)
// @route   PATCH /api/users/:id/status
// @access  Private (Admin)
router.patch("/:id/status", auth, adminAuth, async (req, res) => {
  // Check this parameter
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

import Social from "../models/Social.js";

// @desc    Get all social links
// @route   GET /api/socials
// @access  Public
export const getSocials = async (req, res) => {
  try {
    const socials = await Social.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: socials.length,
      data: socials,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Get single social link
// @route   GET /api/socials/:id
// @access  Public
export const getSocial = async (req, res) => {
  try {
    const social = await Social.findById(req.params.id);

    if (!social) {
      return res.status(404).json({
        success: false,
        message: "Social link not found",
      });
    }

    res.status(200).json({
      success: true,
      data: social,
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Social link not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Create social link
// @route   POST /api/socials
// @access  Public (you might want to add authentication middleware)
export const createSocial = async (req, res) => {
  try {
    const { link } = req.body;

    // Basic validation
    if (!link) {
      return res.status(400).json({
        success: false,
        message: "Link is required",
      });
    }

    const social = await Social.create({ link });

    res.status(201).json({
      success: true,
      message: "Social link created successfully",
      data: social,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Update social link
// @route   PUT /api/socials/:id
// @access  Public (you might want to add authentication middleware)
export const updateSocial = async (req, res) => {
  try {
    const { link } = req.body;

    let social = await Social.findById(req.params.id);

    if (!social) {
      return res.status(404).json({
        success: false,
        message: "Social link not found",
      });
    }

    social = await Social.findByIdAndUpdate(
      req.params.id,
      { link },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Social link updated successfully",
      data: social,
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Social link not found",
      });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Delete social link
// @route   DELETE /api/socials/:id
// @access  Public (you might want to add authentication middleware)
export const deleteSocial = async (req, res) => {
  try {
    const social = await Social.findById(req.params.id);

    if (!social) {
      return res.status(404).json({
        success: false,
        message: "Social link not found",
      });
    }

    await Social.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Social link deleted successfully",
      data: {},
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Social link not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

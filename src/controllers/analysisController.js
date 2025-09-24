import mongoose from "mongoose";
import Analysis from "../models/Analysis.js";

// Create a new analysis
export const createAnalysis = async (req, res) => {
  try {
    const { sourceBy, metadata } = req.body;

    // Validate required fields
    if (!sourceBy) {
      return res.status(400).json({
        success: false,
        message: "sourceBy is required",
      });
    }

    const analysis = new Analysis({
      sourceBy,
      metadata: metadata || {},
    });

    const savedAnalysis = await analysis.save();

    res.status(201).json({
      success: true,
      message: "Analysis created successfully",
      data: savedAnalysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating analysis",
      error: error.message,
    });
  }
};

// Get all analyses with optional filtering and pagination
export const getAllAnalyses = async (req, res) => {
  try {
    const { page = 1, limit = 10, sourceBy } = req.query;

    // Build filter object
    const filter = {};
    if (sourceBy) {
      filter.sourceBy = sourceBy;
    }

    const analyses = await Analysis.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Analysis.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: analyses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching analyses",
      error: error.message,
    });
  }
};

// Get single analysis by ID
export const getAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid analysis ID format",
      });
    }

    const analysis = await Analysis.findById(id);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching analysis",
      error: error.message,
    });
  }
};

// Update analysis by ID
export const updateAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const { sourceBy, metadata } = req.body;

    // Validate MongoDB ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid analysis ID format",
      });
    }

    const updateData = {};
    if (sourceBy) updateData.sourceBy = sourceBy;
    if (metadata) updateData.metadata = metadata;

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    const updatedAnalysis = await Analysis.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedAnalysis) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Analysis updated successfully",
      data: updatedAnalysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating analysis",
      error: error.message,
    });
  }
};

// Delete analysis by ID
export const deleteAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid analysis ID format",
      });
    }

    const deletedAnalysis = await Analysis.findByIdAndDelete(id);

    if (!deletedAnalysis) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Analysis deleted successfully",
      data: deletedAnalysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting analysis",
      error: error.message,
    });
  }
};

// Get analyses by source
export const getAnalysesBySource = async (req, res) => {
  try {
    const { source } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const analyses = await Analysis.find({ sourceBy: source })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Analysis.countDocuments({ sourceBy: source });

    res.status(200).json({
      success: true,
      data: analyses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching analyses by source",
      error: error.message,
    });
  }
};

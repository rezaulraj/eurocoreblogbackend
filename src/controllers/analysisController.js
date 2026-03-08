// controllers/analysisController.js
import { Op } from "sequelize";
import Analysis from "../models/Analysis.js";

export const createAnalysis = async (req, res) => {
  try {
    const { sourceBy, metadata } = req.body;

    if (!sourceBy) {
      return res.status(400).json({
        success: false,
        message: "sourceBy is required",
      });
    }

    const analysis = await Analysis.create({
      sourceBy,
      metadata: metadata || {},
    });

    res.status(201).json({
      success: true,
      message: "Analysis created successfully",
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating analysis",
      error: error.message,
    });
  }
};

export const getAllAnalyses = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const sourceBy = req.query.sourceBy;

    const where = {};
    if (sourceBy) where.sourceBy = sourceBy;

    const { rows, count } = await Analysis.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit,
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

export const getAnalysisById = async (req, res) => {
  try {
    const analysis = await Analysis.findByPk(req.params.id);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }

    res.status(200).json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching analysis",
      error: error.message,
    });
  }
};

export const updateAnalysis = async (req, res) => {
  try {
    const { sourceBy, metadata } = req.body;

    const analysis = await Analysis.findByPk(req.params.id);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }

    await analysis.update({
      ...(sourceBy !== undefined ? { sourceBy } : {}),
      ...(metadata !== undefined ? { metadata } : {}),
    });

    res.status(200).json({
      success: true,
      message: "Analysis updated successfully",
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating analysis",
      error: error.message,
    });
  }
};

export const deleteAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findByPk(req.params.id);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }

    await analysis.destroy();

    res.status(200).json({
      success: true,
      message: "Analysis deleted successfully",
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting analysis",
      error: error.message,
    });
  }
};

export const getAnalysesBySource = async (req, res) => {
  try {
    const source = req.params.source;
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);

    const { rows, count } = await Analysis.findAndCountAll({
      where: { sourceBy: source },
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit,
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

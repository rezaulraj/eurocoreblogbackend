// controllers/analyticsController.js
import Analytics from "../models/Analytics.js";

export const createAnalytics = async (req, res) => {
  try {
    const { source, metric, value, metadata } = req.body;

    if (!["google", "facebook"].includes(source)) {
      return res.status(400).json({ message: "Invalid analytics source" });
    }

    const record = await Analytics.create({
      source,
      metric,
      value,
      metadata,
    });

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const { source } = req.query;
    const where = {};
    if (source) where.source = source;

    const analytics = await Analytics.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAnalyticsById = async (req, res) => {
  try {
    const record = await Analytics.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: "Not found" });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAnalytics = async (req, res) => {
  try {
    const record = await Analytics.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: "Not found" });

    await record.update(req.body);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAnalytics = async (req, res) => {
  try {
    const record = await Analytics.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: "Not found" });

    await record.destroy();
    res.json({ message: "Analytics record deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

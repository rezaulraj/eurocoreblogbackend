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
    let query = {};
    if (source) query.source = source;

    const analytics = await Analytics.find(query).sort({ createdAt: -1 });
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAnalyticsById = async (req, res) => {
  try {
    const record = await Analytics.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Not found" });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAnalytics = async (req, res) => {
  try {
    const updated = await Analytics.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAnalytics = async (req, res) => {
  try {
    const deleted = await Analytics.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Analytics record deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

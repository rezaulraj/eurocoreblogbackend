import express from "express";
import Visitor from "../models/Visitor.js";
import geoip from "geoip-lite";

const router = express.Router();

// Track visitor

router.post("/track", async (req, res) => {
  try {
    let ip =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    console.log("ip", ip);
    // Replace localhost IP for testing
    if (ip === "::1" || ip === "127.0.0.1") ip = "8.8.8.8";

    const geo = geoip.lookup(ip);
    const country = geo?.country || "Unknown";
    console.log("geo", geo, country);
    let visitor = await Visitor.findOne({ ip });
    if (!visitor) {
      visitor = new Visitor({ ip, country });
    } else {
      visitor.visits += 1;
    }

    await visitor.save();

    const totalVisitors = await Visitor.countDocuments();
    const visitorsByCountry = await Visitor.aggregate([
      { $group: { _id: "$country", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      message: "Visitor tracked",
      totalVisitors,
      visitorsByCountry,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error tracking visitor" });
  }
});

// Admin API: Get summary
router.get("/summary", async (req, res) => {
  try {
    const totalVisitors = await Visitor.countDocuments();
    const visitorsByCountry = await Visitor.aggregate([
      { $group: { _id: "$country", count: { $sum: 1 } } },
    ]);

    res.json({ totalVisitors, visitorsByCountry });
  } catch (err) {
    res.status(500).json({ error: "Error fetching summary" });
  }
});

export default router;

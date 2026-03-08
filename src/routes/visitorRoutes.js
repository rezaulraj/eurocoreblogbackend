import express from "express";
import geoip from "geoip-lite";
import { fn, col } from "sequelize";
import Visitor from "../models/Visitor.js";

const router = express.Router();

router.post("/track", async (req, res) => {
  try {
    let ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress;

    if (ip === "::1" || ip === "127.0.0.1") ip = "8.8.8.8";

    const geo = geoip.lookup(ip);
    const country = geo?.country || "Unknown";

    let visitor = await Visitor.findOne({ where: { ip } });

    if (!visitor) {
      visitor = await Visitor.create({ ip, country, visits: 1 });
    } else {
      visitor.visits += 1;
      await visitor.save();
    }

    const totalVisitors = await Visitor.count();

    const visitorsByCountryRaw = await Visitor.findAll({
      attributes: ["country", [fn("COUNT", col("country")), "count"]],
      group: ["country"],
      raw: true,
    });

    const visitorsByCountry = visitorsByCountryRaw.map((v) => ({
      _id: v.country,
      count: Number(v.count),
    }));

    res.json({
      success: true,
      message: "Visitor tracked",
      totalVisitors,
      visitorsByCountry,
    });
  } catch (err) {
    res.status(500).json({ error: "Error tracking visitor" });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const totalVisitors = await Visitor.count();

    const visitorsByCountryRaw = await Visitor.findAll({
      attributes: ["country", [fn("COUNT", col("country")), "count"]],
      group: ["country"],
      raw: true,
    });

    const visitorsByCountry = visitorsByCountryRaw.map((v) => ({
      _id: v.country,
      count: Number(v.count),
    }));

    res.json({ totalVisitors, visitorsByCountry });
  } catch (err) {
    res.status(500).json({ error: "Error fetching summary" });
  }
});

export default router;

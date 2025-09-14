import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ["google", "facebook"],
      required: true,
    },
    metric: { type: String, required: true }, // e.g. page_views, clicks, conversions
    value: { type: Number, required: true },
    date: { type: Date, default: Date.now }, // when recorded
    metadata: { type: Object }, // store extra details (campaignId, userAgent, referrer, etc.)
  },
  { timestamps: true }
);

export default mongoose.model("Analytics", analyticsSchema);

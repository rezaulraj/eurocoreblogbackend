import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema({
  ip: { type: String, unique: true },
  country: { type: String }, // 🌍 important
  firstVisit: { type: Date, default: Date.now },
  visits: { type: Number, default: 1 },
});

export default mongoose.model("Visitor", visitorSchema);

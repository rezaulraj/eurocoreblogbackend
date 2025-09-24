import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    sourceBy: {
      type: String,
      required: true,
    },
    metadata: { type: Object },
  },
  { timestamps: true }
);

export default mongoose.model("Analysis", analysisSchema);

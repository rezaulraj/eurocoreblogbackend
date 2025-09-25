import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
    },
    image: {
      type: String,
      required: true,
    },
    imgbbId: {
      type: String, // Store ImgBB image ID for reference
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Gallery", gallerySchema);

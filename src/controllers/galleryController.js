import Gallery from "../models/Gallery.js";
import imgbbUploader from "imgbb-uploader";

export const createGallery = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Convert buffer to base64 for ImgBB
    const base64Image = req.file.buffer.toString("base64");

    // Upload to ImgBB instead of Cloudinary
    const result = await imgbbUploader({
      apiKey: process.env.IMGBB_API_KEY, // Make sure to add this to your .env
      base64string: base64Image,
      name: req.body.text || `gallery-${Date.now()}`,
    });

    const gallery = await Gallery.create({
      text: req.body.text,
      image: result.url, // ImgBB returns the URL directly
      imgbbId: result.id, // Store ImgBB ID for reference
    });

    res.status(201).json(gallery);
  } catch (err) {
    console.error("ImgBB Upload Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all Gallerys (unchanged)
export const getGallerys = async (req, res) => {
  try {
    const gallerys = await Gallery.find().sort({ createdAt: -1 });
    res.json(gallerys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single Gallery (unchanged)
export const getGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) return res.status(404).json({ message: "Not found" });
    res.json(gallery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update Gallery (text + new image optional)
export const updateGallery = async (req, res) => {
  try {
    let updateData = { text: req.body.text };

    if (req.file) {
      // Convert buffer to base64 for ImgBB
      const base64Image = req.file.buffer.toString("base64");

      // Upload new image to ImgBB
      const result = await imgbbUploader({
        apiKey: process.env.IMGBB_API_KEY,
        base64string: base64Image,
        name: req.body.text || `gallery-update-${Date.now()}`,
      });

      updateData.image = result.url;
      updateData.imgbbId = result.id;
    }

    const updatedGallery = await Gallery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedGallery) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    res.json(updatedGallery);
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete Gallery
export const deleteGallery = async (req, res) => {
  try {
    const deletedGallery = await Gallery.findByIdAndDelete(req.params.id);

    if (!deletedGallery) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    // Note: ImgBB free plan doesn't support image deletion via API
    // The image will remain on ImgBB servers, only the database record is deleted
    res.json({
      message: "Gallery deleted successfully",
      note: "Image remains on ImgBB servers (free plan limitation)",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

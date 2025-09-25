import Gallery from "../models/Gallery.js";
import cloudinary from "../config/cloudinary.js";

export const createGallery = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "gallerys" },
        (error, uploadResult) => {
          if (error) return reject(error);
          resolve(uploadResult);
        }
      );
      stream.end(req.file.buffer); // use buffer, not stream
    });

    const gallery = await Gallery.create({
      text: req.body.text,
      image: result.secure_url,
    });

    res.status(201).json(gallery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all Gallerys
export const getGallerys = async (req, res) => {
  try {
    const gallerys = await Gallery.find().sort({ createdAt: -1 });
    res.json(gallerys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single Gallery
export const getGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) return res.status(404).json({ message: "Not found" });
    res.json(gallery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update category (text + new image optional)
export const updateCategory = async (req, res) => {
  try {
    let updateData = { text: req.body.text };

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "gallerys" },
          (error, uploadResult) => {
            if (error) return reject(error);
            resolve(uploadResult);
          }
        );
        stream.end(req.file.buffer);
      });

      updateData.image = result.secure_url;
    } else {
      const updated = await Gallery.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );
      res.json(updated);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete category
export const deleteGallery = async (req, res) => {
  try {
    const deleted = await Gallery.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Gallery deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

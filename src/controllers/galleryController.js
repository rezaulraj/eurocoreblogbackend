// controllers/galleryController.js
import Gallery from "../models/Gallery.js";
import imgbbUploader from "imgbb-uploader";
import { Op } from "sequelize";

const normalizeText = (v = "") => String(v).trim();

const uploadToImgBB = async (buffer, name) => {
  const base64Image = buffer.toString("base64");
  return imgbbUploader({
    apiKey: process.env.IMGBB_API_KEY,
    base64string: base64Image,
    name: name || `gallery-${Date.now()}`,
  });
};

// CREATE
export const createGallery = async (req, res) => {
  try {
    const text = normalizeText(req.body.text);

    if (!text) {
      return res
        .status(400)
        .json({ success: false, message: "Text is required" });
    }
    if (text.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Text must be less than or equal to 50 characters",
      });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Image is required" });
    }

    // check unique text before upload (saves ImgBB usage)
    const exists = await Gallery.findOne({ where: { text } });
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "Text already exists" });
    }

    const result = await uploadToImgBB(req.file.buffer, text);

    const gallery = await Gallery.create({
      text,
      image: result.url,
      imgbbId: result.id,
    });

    return res.status(201).json({ success: true, data: gallery });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ success: false, message: "Text already exists" });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET ALL
export const getGalleries = async (req, res) => {
  try {
    const galleries = await Gallery.findAll({ order: [["createdAt", "DESC"]] });
    return res.json({ success: true, data: galleries });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET ONE
export const getGalleryById = async (req, res) => {
  try {
    const gallery = await Gallery.findByPk(req.params.id);
    if (!gallery)
      return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: gallery });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE (text optional, image optional)
export const updateGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findByPk(req.params.id);
    if (!gallery)
      return res
        .status(404)
        .json({ success: false, message: "Gallery not found" });

    const updateData = {};

    // update text only if provided
    if (req.body.text !== undefined) {
      const text = normalizeText(req.body.text);

      if (!text) {
        return res
          .status(400)
          .json({ success: false, message: "Text cannot be empty" });
      }
      if (text.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Text must be less than or equal to 50 characters",
        });
      }

      // unique check (exclude current id)
      const exists = await Gallery.findOne({
        where: { text, id: { [Op.ne]: gallery.id } },
      });
      if (exists) {
        return res
          .status(400)
          .json({ success: false, message: "Text already exists" });
      }

      updateData.text = text;
    }

    // update image if provided
    if (req.file) {
      const name =
        updateData.text || gallery.text || `gallery-update-${Date.now()}`;
      const result = await uploadToImgBB(req.file.buffer, name);
      updateData.image = result.url;
      updateData.imgbbId = result.id;
    }

    await gallery.update(updateData);

    return res.json({ success: true, data: gallery });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ success: false, message: "Text already exists" });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
export const deleteGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findByPk(req.params.id);
    if (!gallery)
      return res
        .status(404)
        .json({ success: false, message: "Gallery not found" });

    await gallery.destroy();

    return res.json({
      success: true,
      message: "Gallery deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

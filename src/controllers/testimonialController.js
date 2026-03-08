// controllers/testimonialController.js
import Testimonial from "../models/Testimonial.js";
import imgbbUploader from "imgbb-uploader";

const uploadToImgBB = async (fileBuffer, fileName) => {
  const base64Image = fileBuffer.toString("base64");

  return imgbbUploader({
    apiKey: process.env.IMGBB_API_KEY,
    base64string: base64Image,
    name: fileName || `testimonial-${Date.now()}`,
  });
};

export const createTestimonial = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Image is required" });

    const result = await uploadToImgBB(req.file.buffer, req.body.author);

    const testimonial = await Testimonial.create({
      author: req.body.author,
      role: req.body.role,
      text: req.body.text,
      image: result.url,
      imgbbId: result.id,
      tags: req.body.tags ? req.body.tags.split(",").map((t) => t.trim()) : [],
      rating: req.body.rating || 5,
      isFeatured: req.body.isFeatured || false,
    });

    res.status(201).json(testimonial);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByPk(req.params.id);
    if (!testimonial) return res.status(404).json({ message: "Not found" });
    res.json(testimonial);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByPk(req.params.id);
    if (!testimonial) return res.status(404).json({ message: "Not found" });

    const updateData = {
      author: req.body.author,
      role: req.body.role,
      text: req.body.text,
      tags: req.body.tags
        ? req.body.tags.split(",").map((t) => t.trim())
        : testimonial.tags,
      rating: req.body.rating,
      isFeatured: req.body.isFeatured,
    };

    if (req.file) {
      const result = await uploadToImgBB(req.file.buffer, req.body.author);
      updateData.image = result.url;
      updateData.imgbbId = result.id;
      console.log(
        "Old image remains on ImgBB (free plan limitation):",
        testimonial.imgbbId,
      );
    }

    await testimonial.update(updateData);
    res.json(testimonial);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByPk(req.params.id);
    if (!testimonial) return res.status(404).json({ message: "Not found" });

    console.log(
      "Image remains on ImgBB (free plan limitation):",
      testimonial.imgbbId,
    );
    await testimonial.destroy();

    res.json({
      message: "Testimonial deleted successfully",
      note: "Image remains on ImgBB servers due to free plan limitations",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

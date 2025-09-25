import Testimonial from "../models/Testimonial.js";
import cloudinary from "../config/cloudinary.js";

// ✅ Upload to Cloudinary (with buffer)
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// ✅ Create new testimonial
export const createTestimonial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const result = await uploadToCloudinary(req.file.buffer, "testimonials");

    const testimonial = await Testimonial.create({
      author: req.body.author,
      role: req.body.role,
      text: req.body.text,
      image: result.secure_url,
      imagePublicId: result.public_id, // ✅ store public_id
      tags: req.body.tags ? req.body.tags.split(",") : [],
      rating: req.body.rating || 5,
      isFeatured: req.body.isFeatured || false,
    });

    res.status(201).json(testimonial);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all testimonials
export const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single testimonial
export const getTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ message: "Not found" });
    res.json(testimonial);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update testimonial (remove old image if new one uploaded)
export const updateTestimonial = async (req, res) => {
  try {
    let updateData = {
      author: req.body.author,
      role: req.body.role,
      text: req.body.text,
      tags: req.body.tags ? req.body.tags.split(",") : [],
      rating: req.body.rating,
      isFeatured: req.body.isFeatured,
    };

    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ message: "Not found" });

    if (req.file) {
      // Delete old image if exists
      if (testimonial.imagePublicId) {
        await cloudinary.uploader.destroy(testimonial.imagePublicId);
      }

      const result = await uploadToCloudinary(req.file.buffer, "testimonials");
      updateData.image = result.secure_url;
      updateData.imagePublicId = result.public_id;
    }

    const updated = await Testimonial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete testimonial (also delete image from Cloudinary)
export const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ message: "Not found" });

    // Delete image from Cloudinary
    if (testimonial.imagePublicId) {
      await cloudinary.uploader.destroy(testimonial.imagePublicId);
    }

    await testimonial.deleteOne();

    res.json({ message: "Testimonial deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

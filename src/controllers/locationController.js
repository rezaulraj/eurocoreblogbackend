// controllers/locationController.js
import { Op, fn, col, where as sqlWhere } from "sequelize";
import Location from "../models/Location.js";

const normalize = (v = "") => String(v).trim();

export const createLocation = async (req, res) => {
  try {
    const raw = normalize(req.body.location);

    if (!raw) {
      return res
        .status(400)
        .json({ success: false, message: "Location is required" });
    }

    if (raw.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Location must be less than 50 characters",
      });
    }

    // Case-insensitive duplicate check
    const exists = await Location.findOne({
      where: sqlWhere(fn("LOWER", col("location")), raw.toLowerCase()),
    });

    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "Location already exists" });
    }

    const created = await Location.create({ location: raw });

    return res.status(201).json({
      success: true,
      message: "Location created successfully",
      data: created,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ success: false, message: "Location already exists" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLocations = async (req, res) => {
  try {
    // simple list (optional search + pagination)
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const search = normalize(req.query.search || "");

    const where = {};
    if (search) where.location = { [Op.like]: `%${search}%` };

    const { rows, count } = await Location.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });

    return res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLocationById = async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);

    if (!location) {
      return res
        .status(404)
        .json({ success: false, message: "Location not found" });
    }

    return res.json({ success: true, data: location });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const record = await Location.findByPk(req.params.id);

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Location not found" });
    }

    // only one field for now
    const raw = normalize(req.body.location);

    if (!raw) {
      return res
        .status(400)
        .json({ success: false, message: "Location is required" });
    }

    if (raw.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Location must be less than 50 characters",
      });
    }

    // if changed, check duplicates (case-insensitive)
    if (raw.toLowerCase() !== record.location.toLowerCase()) {
      const exists = await Location.findOne({
        where: {
          [Op.and]: [
            sqlWhere(fn("LOWER", col("location")), raw.toLowerCase()),
            { id: { [Op.ne]: record.id } },
          ],
        },
      });

      if (exists) {
        return res
          .status(400)
          .json({ success: false, message: "Location already exists" });
      }
    }

    record.location = raw;
    await record.save();

    return res.json({
      success: true,
      message: "Location updated successfully",
      data: record,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ success: false, message: "Location already exists" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteLocation = async (req, res) => {
  try {
    const record = await Location.findByPk(req.params.id);

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Location not found" });
    }

    await record.destroy();

    return res.json({
      success: true,
      message: "Location deleted successfully",
      data: { id: record.id, location: record.location },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

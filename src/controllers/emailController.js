import { Op } from "sequelize";
import Email from "../models/Email.js";

// CREATE
const createEmail = async (req, res) => {
  try {
    let { email, emailBy } = req.body;

    if (!email || !email.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    email = email.trim().toLowerCase();

    const existingEmail = await Email.findOne({ where: { email } });
    if (existingEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    // validate emailBy
    if (emailBy && !["user", "admin"].includes(emailBy)) {
      return res.status(400).json({
        success: false,
        message: "emailBy must be 'user' or 'admin'",
      });
    }

    const newEmail = await Email.create({
      email,
      emailBy: emailBy || "user",
    });

    res.status(201).json({
      success: true,
      message: "Email created successfully",
      data: newEmail,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET LIST (with optional search + pagination)
const getEmails = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const search = (req.query.search || "").trim();

    const where = {};
    if (search) where.email = { [Op.like]: `%${search}%` };

    const { rows, count } = await Email.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });

    res.json({
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET SINGLE
const getEmailById = async (req, res) => {
  try {
    const email = await Email.findByPk(req.params.id);

    if (!email) {
      return res
        .status(404)
        .json({ success: false, message: "Email not found" });
    }

    res.json({ success: true, data: email });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE
const updateEmail = async (req, res) => {
  try {
    let { email, emailBy } = req.body;

    const emailRecord = await Email.findByPk(req.params.id);
    if (!emailRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Email not found" });
    }

    // update email
    if (email !== undefined) {
      if (!email.trim()) {
        return res
          .status(400)
          .json({ success: false, message: "Email cannot be empty" });
      }

      email = email.trim().toLowerCase();

      const existingEmail = await Email.findOne({
        where: {
          email,
          id: { [Op.ne]: emailRecord.id },
        },
      });

      if (existingEmail) {
        return res
          .status(400)
          .json({ success: false, message: "Email already exists" });
      }

      emailRecord.email = email;
    }

    // update emailBy
    if (emailBy !== undefined) {
      if (!["user", "admin"].includes(emailBy)) {
        return res.status(400).json({
          success: false,
          message: "emailBy must be 'user' or 'admin'",
        });
      }
      emailRecord.emailBy = emailBy;
    }

    await emailRecord.save();

    res.json({
      success: true,
      message: "Email updated successfully",
      data: emailRecord,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE SINGLE
const deleteEmail = async (req, res) => {
  try {
    const emailRecord = await Email.findByPk(req.params.id);

    if (!emailRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Email not found" });
    }

    await emailRecord.destroy();

    res.json({
      success: true,
      message: "Email deleted successfully",
      data: { id: emailRecord.id, email: emailRecord.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { createEmail, getEmails, getEmailById, updateEmail, deleteEmail };

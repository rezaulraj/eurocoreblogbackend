// controllers/contactController.js
import { Op } from "sequelize";
import Contact from "../models/Contact.js";

const createContact = async (req, res) => {
  try {
    const { title, phone } = req.body;

    const contactExists = await Contact.findOne({ where: { title } });
    if (contactExists) {
      return res
        .status(400)
        .json({ success: false, message: "Contact title already exists" });
    }

    const contact = await Contact.create({ title, phone });

    res.status(201).json({
      success: true,
      message: "Contact created successfully",
      data: contact,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ success: false, message: "Title or phone already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const getContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const search = req.query.search;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "ASC" : "DESC";

    const where = {};
    if (search) where.title = { [Op.like]: `%${search}%` };

    const { rows, count } = await Contact.findAndCountAll({
      where,
      order: [[sortBy, sortOrder]],
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

const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);

    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateContact = async (req, res) => {
  try {
    const { title, phone } = req.body;

    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    if (title && title !== contact.title) {
      const titleExists = await Contact.findOne({ where: { title } });
      if (titleExists) {
        return res
          .status(400)
          .json({ success: false, message: "Contact title already exists" });
      }
    }

    await contact.update({
      title: title ?? contact.title,
      phone: phone ?? contact.phone,
    });

    res.json({
      success: true,
      message: "Contact updated successfully",
      data: contact,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ success: false, message: "Title or phone already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);

    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    await contact.destroy();

    res.json({
      success: true,
      message: "Contact deleted successfully",
      data: { id: req.params.id },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const bulkDeleteContacts = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of contact IDs to delete",
      });
    }

    const deletedCount = await Contact.destroy({
      where: { id: { [Op.in]: ids } },
    });

    if (deletedCount > 0) {
      return res.json({
        success: true,
        message: `${deletedCount} contact(s) deleted successfully`,
        data: { deletedCount },
      });
    }

    res
      .status(404)
      .json({ success: false, message: "No contacts found to delete" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getContactStats = async (req, res) => {
  try {
    const total = await Contact.count();

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const recent = await Contact.count({
      where: {
        createdAt: { [Op.gte]: lastWeek },
      },
    });

    res.json({
      success: true,
      data: { total, recent },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  bulkDeleteContacts,
  getContactStats,
};

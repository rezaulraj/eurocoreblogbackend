// controllers/socialController.js
import Social from "../models/Social.js";

const normalize = (v = "") => String(v).trim();

export const createSocial = async (req, res) => {
  try {
    const link = normalize(req.body.link);

    if (!link) {
      return res
        .status(400)
        .json({ success: false, message: "Link is required" });
    }

    const social = await Social.create({ link });

    return res.status(201).json({ success: true, data: social });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSocials = async (req, res) => {
  try {
    const socials = await Social.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: socials });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSocialById = async (req, res) => {
  try {
    const social = await Social.findByPk(req.params.id);

    if (!social) {
      return res
        .status(404)
        .json({ success: false, message: "Social not found" });
    }

    return res.status(200).json({ success: true, data: social });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSocial = async (req, res) => {
  try {
    const social = await Social.findByPk(req.params.id);

    if (!social) {
      return res
        .status(404)
        .json({ success: false, message: "Social not found" });
    }

    const link = normalize(req.body.link);
    if (!link) {
      return res
        .status(400)
        .json({ success: false, message: "Link is required" });
    }

    await social.update({ link });

    return res.status(200).json({ success: true, data: social });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSocial = async (req, res) => {
  try {
    const social = await Social.findByPk(req.params.id);

    if (!social) {
      return res
        .status(404)
        .json({ success: false, message: "Social not found" });
    }

    await social.destroy();

    return res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

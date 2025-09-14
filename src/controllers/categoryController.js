import Category from "../models/Category.js";

// GET all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message
    });
  }
};

// GET single category by ID
export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }

    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching category",
      error: error.message
    });
  }
};

// CREATE new category
export const createCategory = async (req, res) => {
  try {
    const { title } = req.body;

    // Validation
    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Title is required"
      });
    }

    if (title.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Title must be less than 50 characters"
      });
    }

    const category = await Category.create({ title });
    
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category title already exists"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error creating category",
      error: error.message
    });
  }
};

// UPDATE category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }

    // Validation
    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Title is required"
      });
    }

    if (title.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Title must be less than 50 characters"
      });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { title },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category title already exists"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error updating category",
      error: error.message
    });
  }
};

// DELETE category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting category",
      error: error.message
    });
  }
};
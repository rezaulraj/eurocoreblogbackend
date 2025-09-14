import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      maxlength: 300,
    },
    image: {
      // Updated from featuredImage to image object
      url: {
        type: String,
        default: null,
      },
      publicId: {
        type: String,
        default: null,
      },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    metaDescription: {
      type: String,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

// Slug generation middleware
postSchema.pre("validate", function (next) {
  if (this.isNew || this.isModified("title")) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");

    if (!this.slug) {
      this.slug = `post-${Date.now()}`;
    }
  }
  next();
});

// Indexes for performance
postSchema.index({ author: 1, status: 1 });
postSchema.index({ publishedAt: -1 });

export default mongoose.model("Post", postSchema);

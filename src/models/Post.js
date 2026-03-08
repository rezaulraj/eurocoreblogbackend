// models/Post.js
import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

class Post extends Model {}

Post.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      unique: true,
    },
    content: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    excerpt: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imgbbId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    authorId: {
      // ✅ important
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM("draft", "published", "archived"),
      allowNull: false,
      defaultValue: "draft",
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metaDescription: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Post",
    tableName: "posts",
    timestamps: true,
    hooks: {
      beforeValidate: (post) => {
        // only generate if slug not already set by controller
        if (!post.slug && post.title) {
          let slug = post.title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+/, "")
            .replace(/-+$/, "");

          if (!slug) slug = `post-${Date.now()}`;
          post.slug = slug;
        }
      },
    },
    indexes: [
      { fields: ["authorId", "status"] },
      { fields: ["publishedAt"] },
      { unique: true, fields: ["slug"] },
    ],
  },
);

export default Post;

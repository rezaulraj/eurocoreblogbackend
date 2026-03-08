import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

class Testimonial extends Model {}

Testimonial.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    author: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    text: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    imgbbId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    rating: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      validate: { min: 1, max: 5 },
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Testimonial",
    tableName: "testimonials",
    timestamps: true,
    indexes: [{ fields: ["text"] }],
  }
);

export default Testimonial;
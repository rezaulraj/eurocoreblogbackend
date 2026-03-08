import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

class Visitor extends Model {}

Visitor.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    ip: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    firstVisit: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    visits: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    modelName: "Visitor",
    tableName: "visitors",
    timestamps: false,
  },
);

export default Visitor;

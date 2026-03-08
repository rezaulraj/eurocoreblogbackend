import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

class Analytics extends Model {}

Analytics.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    source: {
      type: DataTypes.ENUM("google", "facebook"),
      allowNull: false,
    },
    metric: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Analytics",
    tableName: "analytics",
    timestamps: true,
  },
);

export default Analytics;

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

class Analysis extends Model {}

Analysis.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    sourceBy: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Analysis",
    tableName: "analyses",
    timestamps: true,
  },
);

export default Analysis;

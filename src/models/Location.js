import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

class Location extends Model {}

Location.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    location: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: "Location",
    tableName: "locations",
    timestamps: true,
  },
);

export default Location;

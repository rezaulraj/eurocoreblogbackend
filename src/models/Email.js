import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

class Email extends Model {}

Email.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    emailBy: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
      defaultValue: "user",
    },
  },
  {
    sequelize,
    modelName: "Email",
    tableName: "emails",
    timestamps: true,
  }
);

export default Email;
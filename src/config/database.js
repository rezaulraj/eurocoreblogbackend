import sequelize from "./db.js";
import "../models/index.js";

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL connected successfully");

    // DEV only
    // await sequelize.sync({ alter: true });
    await sequelize.sync();
    console.log("Database synced");
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};

export default connectDB;

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || "mongodb://localhost:27017/familyvault";
    await mongoose.connect(connStr);
    console.log(`MongoDB Connected successfully to database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

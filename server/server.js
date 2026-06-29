const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// Load environment variables
require("dotenv").config();

// Create Express App
const app = express();
const PORT = process.env.PORT || 5001;

// Connect to Database
connectDB();

// Global Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve local static file uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/albums", require("./routes/albums"));
app.use("/api/photos", require("./routes/photos"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/likes", require("./routes/likes"));

// Root / Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "FamilyVault API is fully functional" });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error("Centralized Error:", err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || "An unexpected internal server error occurred",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start listening locally (skip in serverless Vercel production)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });
}

module.exports = app;

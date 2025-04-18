const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("../config/db");

// Importing routes
const authRoutes = require("../routes/authRoutes");
const userRoutes = require("../routes/userRoutes");
const taskRoutes = require("../routes/taskRoutes");
const reportRoutes = require("../routes/reportRoutes");

// Import the upload middleware for image uploads
const upload = require("../middlewares/uploadMiddlewares");

// Initialize dotenv
dotenv.config();

// Create express app
const app = express();

// Middlewares to handle CORS
// Middlewares to handle CORS
app.use(
  cors({
    origin: [
      "https://task-manager-frontend-alpha-beige.vercel.app", // First frontend URL
      "https://task-manager-frontend-h9t6qfkmy-rajans-projects-dc6a7436.vercel.app" // Second frontend URL
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// Connect database
connectDB();

// Middlewares
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/task", taskRoutes);

// Static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ❌ Remove app.listen() for Vercel
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ✅ Export app for Vercel
module.exports = app;
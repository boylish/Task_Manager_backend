const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

// Initialize dotenv
dotenv.config();

// Create express app
const app = express();

// Middleware to handle CORS
app.use(
  cors({
    origin: "https://task-manager-frontend-three-omega.vercel.app", // Frontend URL without trailing slash
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Ensure OPTIONS is included
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false, // Stop the request from continuing to other middleware if it's a preflight request
    optionsSuccessStatus: 204, // Send a success status for OPTIONS requests (204 is standard)
  })
);

// Connect to the database
connectDB();

// Middleware to parse incoming JSON
app.use(express.json());

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const reportRoutes = require("./routes/reportRoutes");

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/task", taskRoutes);

// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

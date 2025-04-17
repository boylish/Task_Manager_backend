const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { connect } = require("http2");
const connectDB = require("./config/db");


// importing routes
const authRoutes = require("./routes/authRoutes");

const userRoutes = require("./routes/userRoutes")

const taskRoutes = require("./routes/taskRoutes")

const reportRoutes = require("./routes/reportRoutes")

// Initialize dotenv
dotenv.config();

// Create express app
const app = express();

// Middlewares to handle cors
app.use(
    cors({
        origin:process.env.CLIENT_URL || "*",
        methods:["GET" , "POST", "PUT", "DELETE"],
        allowedHeaders:["Content-Type", "Authorization"],
    })
);

// connect database
connectDB();


// middlewares
app.use(express.json());


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/report", reportRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.use("/api/task", taskRoutes);



// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`server is running on port  ${PORT}`))





const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddlewares");
const upload = require("../middlewares/uploadMiddlewares");

const router = express.Router();

// Routes

router.post("/register", registerUser); // for register
router.post("/login", loginUser); // for login
router.get("/profile", protect, getUserProfile); // first verify by token then  get user data
router.put("/updateProfile", protect, updateUserProfile); // first verify by token then update user data

// Routes for image upload

router.post("/upload-image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;

    res.json({
      message: "Image uploaded successfully",
      filePath: `/uploads/${req.file.filename}`,
      imageUrl, // 🔥 send full URL if frontend wants to show the image
    });
  } catch (error) {
    res.status(500).json({
      message: "Upload failed",
      error: error.message,
    });
  }
});


module.exports = router;

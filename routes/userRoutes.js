const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddlewares");
const {
  getAllUsers,
  getUserByID,
  deleteUser,
} = require("../controllers/userController");

const router = express.Router();


// Routes

router.get("/", protect, adminOnly, getAllUsers);
router.get("/:id", protect, getUserByID);
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;

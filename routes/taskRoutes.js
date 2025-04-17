const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddlewares");
const { getAllTasks, createTask, updateTask, deleteTask, updateTaskStatus, getTaskById, getDashboardData, getUserDashboardData, updateTaskChecklist } = require("../controllers/taskController");

const router = express.Router();

// Task Managemrnt Routes

router.get("/" , protect ,getAllTasks );
router.post("/" , protect ,adminOnly ,createTask);
router.get("/dashboard-data" , protect,adminOnly,getDashboardData);
router.get("/user-dashboard-data" , protect, getUserDashboardData );
router.get("/:id" , protect, getTaskById );
router.put("/:id", protect , updateTask);
router.delete("/:id", protect , adminOnly , deleteTask);
router.put("/:id/status", protect, updateTaskStatus);
router.put("/:id/todo", protect , updateTaskChecklist);


module.exports = router;
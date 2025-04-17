const Task = require("../models/Task");
const User = require("../models/User");

// GET all tasks // for Admin - all tasks // for user- only assigned tasks
const getAllTasks = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (status) {
      filter.status = status.toLowerCase(); // Ensuring lowercase match
    }

    let tasks;

    if (req.user.role === "admin") {
      tasks = await Task.find(filter).populate(
        "assignedTo",
        "name email profileImage"
      );
    } else {
      tasks = await Task.find({
        ...filter,
        assignedTo: req.user._id,
      }).populate("assignedTo", "name email profileImage");
    }

    const userFilter =
      req.user.role === "admin" ? {} : { assignedTo: req.user._id };

    const allTasks = await Task.countDocuments(userFilter);

    const pendingTasks = await Task.countDocuments({
      ...userFilter,
      status: "pending",
    });

    const inProgressTasks = await Task.countDocuments({
      ...userFilter,
      status: "in-progress",
    });

    const completedTasks = await Task.countDocuments({
      ...userFilter,
      status: "completed",
    });

    res.json({
      tasks,
      statusSummary: {
        all: allTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET task by ID
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImage"
    );

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// POST a new task (Admin only)
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      status,
      dueDate,
      assignedTo,
      attachments,
      todoChecklists,
      progress,
    } = req.body;

    // Ensure createdBy is taken from the logged-in user (authentication required)
    const creator = req.user._id;

    const newTask = new Task({
      title,
      description,
      priority,
      status,
      dueDate,
      assignedTo,
      createdBy: creator, // Assuming the logged-in user is creating the task
      attachments,
      todoChecklists,
      progress,
    });

    await newTask.save();

    res.status(201).json({ message: "Task created successfully", newTask });
  } catch (error) {
    console.error(error); // Log error for debugging
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// UPDATE task by ID (both Admin & User)
const updateTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      todoChecklists,
      attachments,
      assignedTo,
    } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Admins can update everything, users might be restricted by UI logic
    task.title = title || task.title;
    task.description = description || task.description;
    task.priority = priority || task.priority;
    task.dueDate = dueDate || task.dueDate;
    task.todoChecklists = todoChecklists || task.todoChecklists;
    task.attachments = attachments || task.attachments;
    task.assignedTo = assignedTo || task.assignedTo;

    const updatedTask = await task.save();
    res.json({ message: "Task updated", task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// DELETE task (Admin only)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

//Update Task Status by user
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAssigned = task.assignedTo.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (!isAssigned && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update this task" });
    }

    // Update task status
    task.status = status || task.status;

    // Auto-complete checklist if marked as completed
    if (task.status === "completed") {
      task.todoChecklists = task.todoChecklists.map((item) => ({
        ...item,
        completed: true,
      }));
      task.progress = 100;
    }

    const updatedTask = await task.save();

    res.status(200).json({
      message: "Task status updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error updating task status:", error.message);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// checklist updated
const updateTaskChecklist = async (req, res) => {
  try {
    const { todoChecklists } = req.body; // expecting array of checklist items with `title` and `completed` status

    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!todoChecklists || !Array.isArray(todoChecklists)) {
      return res
        .status(400)
        .json({ message: "Checklist data missing or invalid" });
    }

    // Check if the user is authorized (assigned or admin)
    const isAssigned = task.assignedTo.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (!isAssigned && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update checklist" });
    }

    task.todoChecklists = todoChecklists;

    const completedCount = todoChecklists.filter(
      (item) => item.completed
    ).length;

    const totalItems = task.todoChecklists.length;

    task.progress =
      totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    if (task.progress === 100) {
      task.status = "completed";
    } else if (task.progress > 0) {
      task.status = "in-progress";
    } else {
      task.status = "pending";
    }

    await task.save();
    const updatedTask = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImage"
    );

    res.json({ message: "Task checklist updated", task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET dashboard data for admin
const getDashboardData = async (req, res) => {
  try {
    const allTasks = await Task.find(); // Fetch all tasks

    // Normalize priorities and count
    const priorityLevels = {
      Low: 0,
      Medium: 0,
      High: 0,
    };

    allTasks.forEach(task => {
      const priority = task.priority?.toLowerCase(); // ensure lowercase
      if (priority === 'low') priorityLevels.Low++;
      if (priority === 'medium') priorityLevels.Medium++;
      if (priority === 'high') priorityLevels.High++;
    });

    // Other stats for task distribution
    const taskStatusDistribution = {
      pending: 0,
      'in-progress': 0,
      completed: 0,
      All: allTasks.length,
    };

    allTasks.forEach(task => {
      const status = task.status?.toLowerCase();
      if (status === 'pending') taskStatusDistribution.pending++;
      if (status === 'in-progress') taskStatusDistribution['in-progress']++;
      if (status === 'completed') taskStatusDistribution.completed++;
    });

    // Send response
    res.json({
      statistics: {
        totalTasks: allTasks.length,
        pendingTasks: taskStatusDistribution.pending,
        inProgressTasks: taskStatusDistribution['in-progress'],
        completedTasks: taskStatusDistribution.completed,
        overDueTasks: allTasks.filter(
          t => new Date(t.dueDate) < new Date() && t.status !== 'completed'
        ).length,
      },
      charts: {
        taskDistribution: taskStatusDistribution,
        taskPriorityLevels: priorityLevels,
      },
      recentTasks: allTasks.slice(-10).reverse(), // last 10 tasks
    });
  } catch (err) {
    console.error("Error in getDashboardData:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET dashboard data for individual user
const getUserDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get total task counts
    const totalTasks = await Task.countDocuments({ assignedTo: userId });
    const pendingTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "pending",
    });
    const completedTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "completed",
    });
    const inProgressTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "in-progress",
    });

    // Get overdue tasks
    const overDueTasks = await Task.countDocuments({
      assignedTo: userId,
      status: { $ne: "completed" },
      dueDate: { $lt: new Date() },
    });

    // Get task status distribution using aggregation
    const taskStatuses = ["pending", "in-progress", "completed"];
    const taskDistributionsRaw = await Task.aggregate([
      { $match: { assignedTo: userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g, ""); // Remove spaces for response keys
      acc[formattedKey] =
        taskDistributionsRaw.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});
    taskDistribution["All"] = totalTasks;

    // Get task priority distribution using aggregation
    const taskPriorities = ["Low", "Medium", "High"];
    const taskPriorityLevelsRaw = await Task.aggregate([
      { $match: { assignedTo: userId } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority] =
        taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
      return acc;
    }, {});

    // Get recent tasks
    const recentTasks = await Task.find({ assignedTo: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title status priority dueDate createdAt");

    // Send response
    res.json({
      statistics: {
        totalTasks,
        pendingTasks,
        completedTasks,
        inProgressTasks,
        overDueTasks,
      },
      charts: {
        taskDistribution,
        taskPriorityLevels,
      },
      recentTasks,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};



module.exports = {
  getAllTasks,
  createTask,
  getDashboardData,
  getUserDashboardData,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskChecklist,
};

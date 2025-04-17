const ExcelJS = require("exceljs");
const Task = require("../models/Task");
const User = require("../models/User");

// 🔹 Export Tasks as Excel
const exportTasksReport = async (req, res) => {
  try {
    const tasks = await Task.find().populate("assignedTo", "name email").lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tasks Report");

    worksheet.columns = [
      { header: "Task ID", key: "_id", width: 25 },
      { header: "Title", key: "title", width: 30 },
      { header: "Status", key: "status", width: 15 },
      { header: "Priority", key: "priority", width: 15 },
      { header: "Due Date", key: "dueDate", width: 20 },
      { header: "Assigned To", key: "assignedToName", width: 25 },
      { header: "Assigned Email", key: "assignedToEmail", width: 30 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    tasks.forEach(task => {
      worksheet.addRow({
        _id: task._id.toString(),
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
        assignedToName: task.assignedTo?.name || "N/A",
        assignedToEmail: task.assignedTo?.email || "N/A",
        createdAt: new Date(task.createdAt).toISOString().split("T")[0],
      });
    });

    const timestamp = new Date().toISOString().split("T")[0];
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=tasks_report_${timestamp}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: "Failed to export tasks", error: error.message });
  }
};

// 🔹 Export Users as Excel
const exportUsersReport = async (req, res) => {
  try {
    console.log("Exporting users report...");
    
    const users = await User.find().select("name email _id").lean();
    console.log("Users found:", users.length);

    const tasks = await Task.find().populate("assignedTo", "name email _id").lean();

    console.log("Tasks found:", tasks.length);

    const userTaskMap = {};
    users.forEach(user => {
      userTaskMap[user._id.toString()] = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        taskCount: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
      };
    });

    tasks.forEach(task => {
      const assignedUsers = task.assignedTo; // This is an array
      assignedUsers.forEach(user => {
        const userId = user._id?.toString?.() || user.toString();
        if (userTaskMap[userId]) {
          const userStats = userTaskMap[userId];
          userStats.taskCount += 1;
    
          const status = task.status.toLowerCase();
          if (status === "pending") userStats.pendingTasks += 1;
          else if (status === "in-progress") userStats.inProgressTasks += 1;
          else if (status === "completed") userStats.completedTasks += 1;
        }
      });
    });
    

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users Report");

    worksheet.columns = [
      { header: "User ID", key: "_id", width: 25 },
      { header: "Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Total Tasks", key: "taskCount", width: 15 },
      { header: "Pending Tasks", key: "pendingTasks", width: 20 },
      { header: "In Progress", key: "inProgressTasks", width: 20 },
      { header: "Completed Tasks", key: "completedTasks", width: 20 },
    ];

    Object.values(userTaskMap).forEach(user => {
      worksheet.addRow(user);
    });

    const timestamp = new Date().toISOString().split("T")[0];
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=users_report_${timestamp}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: "Failed to export users", error: error.message });
  }
};

module.exports = {
  exportTasksReport,
  exportUsersReport,
};

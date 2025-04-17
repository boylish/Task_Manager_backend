const Task = require("../models/Task");
const User = require("../models/User");


const getAllUsers = async (req, res) => {
 
    try {
        const users = await User.find({role:"user"}).select("-password");
        
        // Add Task counts to each user
        const userWithTaskCounts = await Promise.all(users.map(async (user)=>{
            const pendingTasks = await Task.countDocuments({assignedTo: user._id, status:"pending"});
            const inProgressTasks = await Task.countDocuments({assignedTo: user._id, status:"In Progress"});
            const completedTasks = await Task.countDocuments({assignedTo: user._id, status:"Completed"});

            return {
                ...user._doc,
                pendingTasks,
                inProgressTasks,
                completedTasks,
            };

        }));

        res.json(userWithTaskCounts);

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }

  };
  
  // ✅ Get user by ID and their tasks
  const getUserByID = async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
  
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const tasks = await Task.find({ user: user._id });
  
      res.json({
        user,
        tasks,
      });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };
  
  // ✅ Delete user and their tasks
  const deleteUser = async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
  
      if (!user) return res.status(404).json({ message: "User not found" });
  
      // First delete all their tasks
      await Task.deleteMany({ user: user._id });
  
      // Then delete the user
      await user.deleteOne();
  
      res.json({ message: "User and their tasks deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };
  
  module.exports = {
    getAllUsers,
    getUserByID,
    deleteUser,
  };
  
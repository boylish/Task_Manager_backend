const mongoose = require("mongoose");

// Sub-schema for individual checklist items
const todoSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, "Checklist item text is required"],
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

// Main Task Schema
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
    },
    description: {
      type: String,
      default: "",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Assigned user is required"],
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    attachments: [
      {
        type: String, // could be file URLs or names
      },
    ],
    todoChecklists: [todoSchema],
    progress: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("Task", taskSchema);

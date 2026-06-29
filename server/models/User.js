const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["member", "admin"],
    default: "member",
  },
  approved: {
    type: Boolean,
    default: true, // Auto-approved for frictionless Instagram-style experience
  },
  joinedDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);

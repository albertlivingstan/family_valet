const mongoose = require("mongoose");

const LikeSchema = new mongoose.Schema({
  photoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Photo",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

// Ensure a user can only like a photo once
LikeSchema.index({ photoId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Like", LikeSchema);

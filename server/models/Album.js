const mongoose = require("mongoose");

const AlbumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&auto=format&fit=crop&q=60",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    privacy: {
      type: String,
      enum: ["private", "family", "public"],
      default: "family",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Album", AlbumSchema);

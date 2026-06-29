const mongoose = require("mongoose");

const PhotoSchema = new mongoose.Schema({
  albumId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Album",
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  imageURL: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    default: "",
  },
  caption: {
    type: String,
    default: "",
  },
  location: {
    type: String,
    default: "",
  },
  dateTaken: {
    type: Date,
    default: Date.now,
  },
  privacy: {
    type: String,
    enum: ["private", "family", "public"],
    default: "family",
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Photo", PhotoSchema);

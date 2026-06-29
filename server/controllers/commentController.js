const Comment = require("../models/Comment");
const Photo = require("../models/Photo");

// Helper to check if a user can access a photo
const checkPhotoAccess = async (photoId, user) => {
  const photo = await Photo.findById(photoId);
  if (!photo) return null;

  if (photo.privacy === "private") {
    if (!user || photo.ownerId.toString() !== user._id.toString()) {
      return false; // private
    }
  } else if (photo.privacy === "family") {
    if (!user) {
      return false; // family access requires login
    }
  }
  return photo;
};

// Add a comment to a photo
exports.addComment = async (req, res) => {
  try {
    const { photoId } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim() === "") {
      return res.status(400).json({ message: "Comment content cannot be empty" });
    }

    const photo = await checkPhotoAccess(photoId, req.user);
    if (photo === null) {
      return res.status(404).json({ message: "Photo not found" });
    }
    if (photo === false) {
      return res.status(403).json({ message: "Unauthorized to comment on this photo" });
    }

    const newComment = new Comment({
      photoId,
      userId: req.user._id,
      comment: comment.trim(),
    });

    await newComment.save();
    
    // Populate user info for immediate response update in frontend
    await newComment.populate("userId", "name profileImage");

    res.status(201).json({ message: "Comment posted successfully", comment: newComment });
  } catch (error) {
    res.status(500).json({ message: "Error adding comment", error: error.message });
  }
};

// Get comments for a specific photo
exports.getCommentsByPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const photo = await checkPhotoAccess(photoId, req.user);

    if (photo === null) {
      return res.status(404).json({ message: "Photo not found" });
    }
    if (photo === false) {
      return res.status(403).json({ message: "Unauthorized to view comments on this photo" });
    }

    const comments = await Comment.find({ photoId })
      .populate("userId", "name profileImage")
      .sort({ createdAt: 1 });

    res.status(200).json({ comments });
  } catch (error) {
    res.status(500).json({ message: "Error fetching comments", error: error.message });
  }
};

// Delete a comment (by comment author, photo owner, or admin)
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const photo = await Photo.findById(comment.photoId);
    if (!photo) {
      return res.status(404).json({ message: "Associated photo not found" });
    }

    // Permission check
    const isCommentAuthor = comment.userId.toString() === req.user._id.toString();
    const isPhotoOwner = photo.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isCommentAuthor && !isPhotoOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to delete this comment" });
    }

    await Comment.findByIdAndDelete(comment._id);
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting comment", error: error.message });
  }
};

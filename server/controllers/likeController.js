const Like = require("../models/Like");
const Photo = require("../models/Photo");

// Helper to check photo access
const checkPhotoAccess = async (photoId, user) => {
  const photo = await Photo.findById(photoId);
  if (!photo) return null;

  if (photo.privacy === "private") {
    if (!user || photo.ownerId.toString() !== user._id.toString()) {
      return false;
    }
  } else if (photo.privacy === "family") {
    if (!user) {
      return false;
    }
  }
  return photo;
};

// Toggle like (like / unlike) on a photo
exports.toggleLike = async (req, res) => {
  try {
    const { photoId } = req.params;
    const userId = req.user._id;

    const photo = await checkPhotoAccess(photoId, req.user);
    if (photo === null) {
      return res.status(404).json({ message: "Photo not found" });
    }
    if (photo === false) {
      return res.status(403).json({ message: "Unauthorized to access this photo" });
    }

    const existingLike = await Like.findOne({ photoId, userId });

    if (existingLike) {
      // Unlike
      await Like.findByIdAndDelete(existingLike._id);
      const likesCount = await Like.countDocuments({ photoId });
      return res.status(200).json({ message: "Photo unliked successfully", liked: false, likesCount });
    } else {
      // Like
      const newLike = new Like({ photoId, userId });
      await newLike.save();
      const likesCount = await Like.countDocuments({ photoId });
      return res.status(200).json({ message: "Photo liked successfully", liked: true, likesCount });
    }
  } catch (error) {
    res.status(500).json({ message: "Error toggling like", error: error.message });
  }
};

// Get likes for a specific photo (returns total likes count and if the requesting user liked it)
exports.getLikesByPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const photo = await checkPhotoAccess(photoId, req.user);

    if (photo === null) {
      return res.status(404).json({ message: "Photo not found" });
    }
    if (photo === false) {
      return res.status(403).json({ message: "Unauthorized to access photo likes" });
    }

    const likesCount = await Like.countDocuments({ photoId });
    
    let hasLiked = false;
    if (req.user) {
      const existingLike = await Like.findOne({ photoId, userId: req.user._id });
      hasLiked = !!existingLike;
    }

    const likes = await Like.find({ photoId }).populate("userId", "name profileImage");

    res.status(200).json({ likesCount, hasLiked, likes });
  } catch (error) {
    res.status(500).json({ message: "Error fetching photo likes", error: error.message });
  }
};

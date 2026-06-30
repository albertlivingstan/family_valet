const Photo = require("../models/Photo");
const Album = require("../models/Album");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

// Upload multiple photos (expects JSON body with base64 data URLs)
exports.uploadPhotos = async (req, res) => {
  try {
    const { albumId, caption, location, dateTaken, privacy, images } = req.body;
    // `images` is an array of base64 data URL strings

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: "No photo files uploaded" });
    }

    let targetAlbumId = albumId;

    // Instagram-style: if no albumId is provided, auto-create a default album for this user
    if (!targetAlbumId) {
      let defaultAlbum = await Album.findOne({
        title: "Instagram Feed",
        ownerId: req.user._id,
      });

      if (!defaultAlbum) {
        defaultAlbum = new Album({
          title: "Instagram Feed",
          description: "All posts uploaded to my main feed",
          coverImage: images[0],
          ownerId: req.user._id,
          privacy: "public", // Make it public by default so everyone can see!
        });
        await defaultAlbum.save();
      }
      targetAlbumId = defaultAlbum._id;
    }

    const album = await Album.findById(targetAlbumId);
    if (!album) {
      return res.status(404).json({ message: "Target album not found" });
    }

    const uploadedPhotos = [];

    for (const imageUrl of images) {
      let finalImageUrl = imageUrl;
      let finalThumbnail = imageUrl;

      // If Cloudinary is configured, upload the base64 image
      if (isCloudinaryConfigured && imageUrl.startsWith("data:")) {
        try {
          console.log("Uploading photo to Cloudinary...");
          const uploadResponse = await cloudinary.uploader.upload(imageUrl, {
            folder: "familyvault",
            resource_type: "auto",
          });
          finalImageUrl = uploadResponse.secure_url;
          // Generate optimized thumbnail using Cloudinary transformation URL injection
          finalThumbnail = uploadResponse.secure_url.replace("/upload/", "/upload/c_thumb,w_300,h_300,g_face/");
          console.log("Cloudinary upload successful:", finalImageUrl);
        } catch (cloudinaryError) {
          console.error("Cloudinary upload failed, falling back to raw base64:", cloudinaryError);
        }
      }

      const photo = new Photo({
        albumId: targetAlbumId,
        ownerId: req.user._id,
        imageURL: finalImageUrl,
        thumbnail: finalThumbnail,
        caption: caption || "Feed Post",
        location: location || "",
        dateTaken: dateTaken ? new Date(dateTaken) : new Date(),
        privacy: privacy || album.privacy,
      });

      await photo.save();
      uploadedPhotos.push(photo);
    }

    // Set cover image of album if it was default unsplash image
    if (album.coverImage.includes("unsplash.com") && uploadedPhotos.length > 0) {
      album.coverImage = uploadedPhotos[0].imageURL;
      await album.save();
    }

    res.status(201).json({
      message: `Successfully uploaded ${uploadedPhotos.length} photos`,
      photos: uploadedPhotos,
    });
  } catch (error) {
    console.error("Upload Photos Error:", error);
    res.status(500).json({ message: "Error uploading photos", error: error.message });
  }
};

// Get photos from a specific album (respecting privacy levels)
exports.getPhotosByAlbum = async (req, res) => {
  try {
    const { albumId } = req.params;
    const album = await Album.findById(albumId);
    
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    // Verify privacy permissions
    if (album.privacy === "private") {
      if (!req.user || album.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied. Private album." });
      }
    }

    let photoQuery = { albumId };
    if (!req.user) {
      photoQuery.privacy = "public";
    } else if (album.ownerId.toString() !== req.user._id.toString()) {
      // Logged in but not the owner of the album
      photoQuery.privacy = { $in: ["public", "family"] };
    }

    const photos = await Photo.find(photoQuery)
      .populate("ownerId", "name profileImage")
      .sort({ dateTaken: 1 });

    res.status(200).json({ photos });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving album photos", error: error.message });
  }
};

// General photos feed (timeline and search)
// Instagram feed style: returns all visible photos sorted by upload time
exports.getPhotosFeed = async (req, res) => {
  try {
    const { search, location, date, albumId } = req.query;
    let query = {};

    // Privacy Filters
    if (req.user) {
      // Logged in: show public, family, and own private photos
      query.$or = [
        { privacy: "public" },
        { privacy: "family" },
        { privacy: "private", ownerId: req.user._id }
      ];
    } else {
      // Guest: can see all public photos (Instagram public style!)
      query.privacy = "public";
    }

    // Specific album override
    if (albumId) {
      query.albumId = albumId;
    }

    // Search filter (searches caption, location)
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { caption: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } }
        ]
      });
    }

    // Location specific filter
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    // DateTaken filter
    if (date) {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate.setHours(0,0,0,0));
      const endOfDay = new Date(searchDate.setHours(23,59,59,999));
      query.dateTaken = { $gte: startOfDay, $lte: endOfDay };
    }

    const photos = await Photo.find(query)
      .populate("ownerId", "name profileImage")
      .populate("albumId", "title")
      .sort({ uploadedAt: -1 }); // Instagram style: newest posts first!

    const Like = require("../models/Like");
    const Comment = require("../models/Comment");

    // Enhance photos with social metrics
    const enhancedPhotos = await Promise.all(
      photos.map(async (photo) => {
        const likesCount = await Like.countDocuments({ photoId: photo._id });
        const comments = await Comment.find({ photoId: photo._id })
          .populate("userId", "name profileImage")
          .sort({ createdAt: -1 })
          .limit(3); // Last 3 comments for feed preview

        let hasLiked = false;
        if (req.user) {
          const like = await Like.findOne({ photoId: photo._id, userId: req.user._id });
          hasLiked = !!like;
        }

        return {
          ...photo.toObject(),
          likesCount,
          hasLiked,
          comments: comments.reverse(), // chronologically ordered comments
        };
      })
    );

    res.status(200).json({ photos: enhancedPhotos });
  } catch (error) {
    res.status(500).json({ message: "Error loading photo feed", error: error.message });
  }
};

// Update photo details
exports.updatePhoto = async (req, res) => {
  try {
    const { caption, location, dateTaken, privacy } = req.body;
    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    // Check permissions
    if (photo.ownerId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to edit this photo" });
    }

    if (caption !== undefined) photo.caption = caption;
    if (location !== undefined) photo.location = location;
    if (dateTaken) photo.dateTaken = new Date(dateTaken);
    if (privacy) photo.privacy = privacy;

    await photo.save();
    res.status(200).json({ message: "Photo details updated successfully", photo });
  } catch (error) {
    res.status(500).json({ message: "Error updating photo", error: error.message });
  }
};

// Delete photo
exports.deletePhoto = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    // Check permissions
    if (photo.ownerId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to delete this photo" });
    }

    await Photo.findByIdAndDelete(photo._id);
    res.status(200).json({ message: "Photo deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting photo", error: error.message });
  }
};

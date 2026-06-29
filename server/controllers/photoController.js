const Photo = require("../models/Photo");
const Album = require("../models/Album");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

// Helper function to upload file to Cloudinary or fallback to local uploads folder URL
const uploadSingleFile = async (file) => {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "familyvault",
        transformation: [{ width: 1200, crop: "limit", quality: "auto" }]
      });
      // Delete temporary local file
      fs.unlinkSync(file.path);
      return {
        url: result.secure_url,
        thumbnail: result.secure_url.replace("/upload/", "/upload/c_thumb,w_300,h_300,g_auto,q_auto/")
      };
    } catch (error) {
      console.error("Cloudinary upload error, using local server storage instead:", error.message);
    }
  }

  // Local storage fallback: return relative URL path
  const filename = path.basename(file.path);
  const relativePath = `/uploads/${filename}`;
  return {
    url: relativePath,
    thumbnail: relativePath
  };
};

// Upload multiple photos to an album
exports.uploadPhotos = async (req, res) => {
  try {
    const { albumId, caption, location, dateTaken, privacy } = req.body;

    if (!albumId) {
      return res.status(400).json({ message: "Album ID is required" });
    }

    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: "Target album not found" });
    }

    // Check upload authorization
    if (album.ownerId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to upload to this album" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No photo files uploaded" });
    }

    const uploadedPhotos = [];

    for (const file of req.files) {
      const uploadResult = await uploadSingleFile(file);

      const photo = new Photo({
        albumId,
        ownerId: req.user._id,
        imageURL: uploadResult.url,
        thumbnail: uploadResult.thumbnail,
        caption: caption || file.originalname.split(".")[0],
        location: location || "",
        dateTaken: dateTaken ? new Date(dateTaken) : new Date(),
        privacy: privacy || album.privacy,
      });

      await photo.save();
      uploadedPhotos.push(photo);
    }

    // Update album cover image with the first uploaded photo if the album has no custom cover
    if (album.coverImage.includes("unsplash.com") && uploadedPhotos.length > 0) {
      album.coverImage = uploadedPhotos[0].imageURL;
      await album.save();
    }

    res.status(201).json({
      message: `Successfully uploaded ${uploadedPhotos.length} photos`,
      photos: uploadedPhotos
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
    } else if (album.privacy === "family") {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required to view family photos." });
      }
    }

    // Query photo list (owners get private photos in this album, family gets family/public photos)
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

// General photos feed with search & filters (Public + Family timeline + Private)
exports.getPhotosFeed = async (req, res) => {
  try {
    const { search, location, date, albumId } = req.query;
    let query = {};

    // Privacy Filters
    if (req.user) {
      query.$or = [
        { privacy: "public" },
        { privacy: "family" },
        { privacy: "private", ownerId: req.user._id }
      ];
    } else {
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
      .sort({ dateTaken: -1 });

    res.status(200).json({ photos });
  } catch (error) {
    res.status(500).json({ message: "Error loading photo feed", error: error.message });
  }
};

// Update photo metadata (caption, location, dateTaken, privacy)
exports.updatePhoto = async (req, res) => {
  try {
    const { caption, location, dateTaken, privacy } = req.body;
    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    // Check permissions (owner or admin)
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

    // Delete local file if it's stored locally
    if (photo.imageURL.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", photo.imageURL);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Photo.findByIdAndDelete(photo._id);
    res.status(200).json({ message: "Photo deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting photo", error: error.message });
  }
};

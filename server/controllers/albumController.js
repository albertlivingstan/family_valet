const Album = require("../models/Album");
const Photo = require("../models/Photo");

// Create a new album
exports.createAlbum = async (req, res) => {
  try {
    const { title, description, coverImage, privacy } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: "Album title is required" });
    }

    const album = new Album({
      title,
      description,
      coverImage,
      privacy: privacy || "family",
      ownerId: req.user._id,
    });

    await album.save();
    res.status(201).json({ message: "Album created successfully", album });
  } catch (error) {
    res.status(500).json({ message: "Error creating album", error: error.message });
  }
};

// Get albums visible to current viewer (handles public, family, and private checks)
exports.getAlbums = async (req, res) => {
  try {
    let query = {};

    if (req.user) {
      // User is logged in and approved, show public, family, and their own private albums
      query = {
        $or: [
          { privacy: "public" },
          { privacy: "family" },
          { privacy: "private", ownerId: req.user._id },
        ],
      };
    } else {
      // Guest: can only see public albums
      query = { privacy: "public" };
    }

    const albums = await Album.find(query)
      .populate("ownerId", "name profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({ albums });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving albums", error: error.message });
  }
};

// Get a single album's details by ID (checking privacy rules)
exports.getAlbumById = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id).populate("ownerId", "name profileImage");
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    // Check privacy
    if (album.privacy === "private") {
      if (!req.user || album.ownerId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied. This album is private." });
      }
    } else if (album.privacy === "family") {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required to view family albums." });
      }
    }

    res.status(200).json({ album });
  } catch (error) {
    res.status(500).json({ message: "Error fetching album", error: error.message });
  }
};

// Update an album's details
exports.updateAlbum = async (req, res) => {
  try {
    const { title, description, coverImage, privacy } = req.body;
    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    // Check permission: must be owner or admin
    if (album.ownerId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to update this album" });
    }

    if (title) album.title = title;
    if (description !== undefined) album.description = description;
    if (coverImage) album.coverImage = coverImage;
    if (privacy) album.privacy = privacy;

    await album.save();
    res.status(200).json({ message: "Album updated successfully", album });
  } catch (error) {
    res.status(500).json({ message: "Error updating album", error: error.message });
  }
};

// Delete album and its photos
exports.deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    // Check permission: owner or admin
    if (album.ownerId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to delete this album" });
    }

    // Delete photos in the album
    await Photo.deleteMany({ albumId: album._id });
    
    // Delete album itself
    await Album.findByIdAndDelete(album._id);

    res.status(200).json({ message: "Album and all its contents deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting album", error: error.message });
  }
};

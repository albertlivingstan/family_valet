const express = require("express");
const router = express.Router();
const photoController = require("../controllers/photoController");
const { requireAuth, optionalAuth } = require("../middleware/auth");

// Photos routes
router.post("/upload", requireAuth, photoController.uploadPhotos);
router.get("/feed", optionalAuth, photoController.getPhotosFeed);
router.get("/album/:albumId", optionalAuth, photoController.getPhotosByAlbum);
router.put("/:id", requireAuth, photoController.updatePhoto);
router.delete("/:id", requireAuth, photoController.deletePhoto);

module.exports = router;

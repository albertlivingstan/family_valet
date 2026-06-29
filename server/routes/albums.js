const express = require("express");
const router = express.Router();
const albumController = require("../controllers/albumController");
const { requireAuth, optionalAuth } = require("../middleware/auth");

// CRUD album routes
router.post("/", requireAuth, albumController.createAlbum);
router.get("/", optionalAuth, albumController.getAlbums);
router.get("/:id", optionalAuth, albumController.getAlbumById);
router.put("/:id", requireAuth, albumController.updateAlbum);
router.delete("/:id", requireAuth, albumController.deleteAlbum);

module.exports = router;

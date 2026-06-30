const express = require("express");
const router = express.Router();
const likeController = require("../controllers/likeController");
const { requireAuth, optionalAuth } = require("../middleware/auth");

// Likes routes
router.post("/photo/:photoId", optionalAuth, likeController.toggleLike);
router.get("/photo/:photoId", optionalAuth, likeController.getLikesByPhoto);

module.exports = router;

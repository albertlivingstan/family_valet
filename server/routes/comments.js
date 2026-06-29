const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const { requireAuth, optionalAuth } = require("../middleware/auth");

// Comments routes
router.post("/photo/:photoId", requireAuth, commentController.addComment);
router.get("/photo/:photoId", optionalAuth, commentController.getCommentsByPhoto);
router.delete("/:id", requireAuth, commentController.deleteComment);

module.exports = router;

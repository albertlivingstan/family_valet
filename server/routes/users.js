const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// Standard member routes
router.get("/me", requireAuth, userController.getMe);
router.put("/profile", requireAuth, userController.updateProfile);
router.get("/members", requireAuth, userController.getMembers);

// Admin-only management routes
router.get("/pending", requireAuth, requireAdmin, userController.getPendingApprovals);
router.post("/:id/approve", requireAuth, requireAdmin, userController.approveUser);
router.put("/:id/role", requireAuth, requireAdmin, userController.changeRole);
router.delete("/:id", requireAuth, requireAdmin, userController.deleteUser);

module.exports = router;

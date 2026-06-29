const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { requireFirebaseToken } = require("../middleware/auth");

// Sync Firebase Authenticated user to MongoDB database
router.post("/sync", requireFirebaseToken, authController.syncUser);

// Local development auth bypass
router.post("/bypass", authController.bypassAuth);

module.exports = router;

const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Sync Firebase Auth user to MongoDB
exports.syncUser = async (req, res) => {
  try {
    const { name, email, profileImage } = req.body;
    const firebaseUid = req.firebaseUser.uid;

    let user = await User.findOne({ firebaseUid });

    if (user) {
      // User exists, update basic details if changed
      let updated = false;
      if (name && user.name !== name) {
        user.name = name;
        updated = true;
      }
      if (profileImage && user.profileImage !== profileImage) {
        user.profileImage = profileImage;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
      return res.status(200).json({
        message: "User details synchronized successfully",
        user
      });
    }

    // Determine if this is the first user in the system
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    user = new User({
      firebaseUid,
      name,
      email,
      profileImage: profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${name || email}`,
      role: isFirstUser ? "admin" : "member",
      approved: isFirstUser ? true : false, // First user approved automatically
    });

    await user.save();

    res.status(201).json({
      message: isFirstUser 
        ? "Admin account created and approved successfully" 
        : "User account created. Awaiting admin approval.",
      user
    });
  } catch (error) {
    console.error("Sync User Error:", error);
    res.status(500).json({ message: "Error syncing user registration details", error: error.message });
  }
};

// Local development bypass auth (one-click login)
exports.bypassAuth = async (req, res) => {
  try {
    const { email, role, approved } = req.body;
    const mockEmail = email || "admin@familyvault.com";
    const mockName = mockEmail.split("@")[0];
    const mockUid = "mock-uid-" + mockName;

    let user = await User.findOne({ firebaseUid: mockUid });
    if (!user) {
      user = new User({
        firebaseUid: mockUid,
        name: mockName.charAt(0).toUpperCase() + mockName.slice(1) + " (Dev)",
        email: mockEmail,
        profileImage: `https://api.dicebear.com/7.x/initials/svg?seed=${mockName}`,
        role: role || "admin",
        approved: approved !== undefined ? approved : true,
      });
      await user.save();
    } else {
      // Update role and approval if specified in bypass request
      if (role) user.role = role;
      if (approved !== undefined) user.approved = approved;
      await user.save();
    }

    // Sign a mock JWT payload matching Firebase claims format
    const token = jwt.sign(
      {
        sub: mockUid,
        email: mockEmail,
        name: user.name,
        picture: user.profileImage,
      },
      "dev-secret",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Bypass auth successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Bypass Auth Error:", error);
    res.status(500).json({ message: "Bypass auth failed", error: error.message });
  }
};


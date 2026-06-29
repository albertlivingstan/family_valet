const User = require("../models/User");

// Get current user profile details
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile", error: error.message });
  }
};

// Update user details
exports.updateProfile = async (req, res) => {
  try {
    const { name, profileImage } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (profileImage) user.profileImage = profileImage;

    await user.save();
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

// List all approved family members (visible to family members)
exports.getMembers = async (req, res) => {
  try {
    const members = await User.find({ approved: true }).select("-firebaseUid");
    res.status(200).json({ members });
  } catch (error) {
    res.status(500).json({ message: "Error fetching family members", error: error.message });
  }
};

// Admin: Get all pending approval requests
exports.getPendingApprovals = async (req, res) => {
  try {
    const pendingUsers = await User.find({ approved: false });
    res.status(200).json({ pendingUsers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending approvals", error: error.message });
  }
};

// Admin: Approve a pending family member
exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.approved = true;
    await user.save();

    res.status(200).json({ message: `Approved user: ${user.name}`, user });
  } catch (error) {
    res.status(500).json({ message: "Error approving user", error: error.message });
  }
};

// Admin: Change user role (member -> admin or admin -> member)
exports.changeRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["member", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role value" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Do not allow self-demotion from admin role
    if (user._id.toString() === req.user._id.toString() && role !== "admin") {
      return res.status(400).json({ message: "You cannot change your own role from Admin." });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ message: `Role updated for ${user.name} to ${role}`, user });
  } catch (error) {
    res.status(500).json({ message: "Error updating user role", error: error.message });
  }
};

// Admin: Delete/remove a user from family
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Protect master admin or deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete yourself." });
    }

    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

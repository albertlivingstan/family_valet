const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "familyvault_default_secret_key";

// Helper to generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// Standard Username/Password Registration
exports.register = async (req, res) => {
  try {
    const { name, password, email } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: "Name and password are required" });
    }

    const trimmedName = name.trim();
    // Check if user already exists
    const existingUser = await User.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, "i") } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine if first user (Admin)
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    const user = new User({
      name: trimmedName,
      email: email || "",
      password: hashedPassword,
      profileImage: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedName)}`,
      role: isFirstUser ? "admin" : "member",
      approved: true, // Auto-approved for frictionless Instagram experience
    });

    await user.save();
    
    // Generate Token
    const token = generateToken(user);

    // Remove password from returned user object
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: "Registration successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

// Standard Username/Password Login
exports.login = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: "Name and password are required" });
    }

    const trimmedName = name.trim();

    // Find User (case-insensitive username or email check)
    let user = await User.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${trimmedName}$`, "i") } },
        { email: { $regex: new RegExp(`^${trimmedName}$`, "i") } }
      ]
    });

    // Auto-bootstrap default family admin user if not present
    if (!user && trimmedName.toLowerCase() === "albertlivingstan73@gmail.com" && password === "Albert2005_29@") {
      console.log("Auto-bootstrapping family admin user: albertlivingstan73@gmail.com");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = new User({
        name: "Albert Livingstan",
        email: "albertlivingstan73@gmail.com",
        password: hashedPassword,
        profileImage: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent("Albert Livingstan")}`,
        role: "admin",
        approved: true
      });
      await user.save();
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate Token
    const token = generateToken(user);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

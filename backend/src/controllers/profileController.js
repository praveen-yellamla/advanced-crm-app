const prisma = require("../config/prisma");
const { uploadToCloudinary } = require("../utils/cloudinary");

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profileImage: true,
        timezone: true,
        themePreference: true,
        notificationPreference: true,
        createdAt: true,
        organization: {
          select: { name: true, plan: { select: { name: true } } }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optional: Get active sessions for the user
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.id, isActive: true },
      select: { id: true, ipAddress: true, deviceName: true, lastUsedAt: true, createdAt: true },
      orderBy: { lastUsedAt: 'desc' },
      take: 5
    });

    res.json({ user, sessions });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Server error retrieving profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, timezone, themePreference, notificationPreference } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name !== undefined ? name : undefined,
        phone: phone !== undefined ? phone : undefined,
        timezone: timezone !== undefined ? timezone : undefined,
        themePreference: themePreference !== undefined ? themePreference : undefined,
        notificationPreference: notificationPreference !== undefined ? notificationPreference : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profileImage: true,
        timezone: true,
        themePreference: true,
        notificationPreference: true
      }
    });

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    console.log("=== AVATAR UPLOAD PIPELINE START ===");
    console.log("Req body:", req.body);
    console.log("Req file:", req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : "No file object attached");

    if (!req.file) {
      console.log("Upload failed: No image file provided");
      return res.status(400).json({ success: false, error: "No image file provided" });
    }

    if (!req.file.mimetype.startsWith('image/')) {
       console.log("Upload failed: Invalid file type");
       return res.status(400).json({ success: false, error: "Please upload a valid image file" });
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_KEY || !process.env.CLOUDINARY_SECRET) {
        console.warn("Upload failed: Cloudinary not configured in .env");
        return res.status(500).json({ success: false, error: "Storage backend (Cloudinary) not configured." });
    }

    console.log("Starting Cloudinary stream upload...");
    const secureUrl = await uploadToCloudinary(req.file.buffer);
    console.log("Cloudinary upload successful:", secureUrl);

    console.log("Updating database for user ID:", req.user.id);
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { profileImage: secureUrl },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profileImage: true,
        timezone: true,
        themePreference: true,
        notificationPreference: true
      }
    });

    console.log("=== AVATAR UPLOAD PIPELINE SUCCESS ===");
    res.json({ 
      success: true, 
      avatarUrl: updatedUser.profileImage,
      user: updatedUser 
    });
  } catch (error) {
    console.error("=== AVATAR UPLOAD PIPELINE FATAL ERROR ===");
    console.error("Full Error Object:", error);
    console.error("Error Message:", error?.message);
    console.error("Error Stack:", error?.stack);
    
    // Cloudinary specific errors
    if (error?.http_code) {
       return res.status(error.http_code).json({ success: false, error: `Cloudinary Error: ${error.message}` });
    }

    res.status(500).json({ 
      success: false, 
      error: error?.message || "Internal server error during avatar upload",
      details: error 
    });
  }
};

exports.removeAvatar = async (req, res) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { profileImage: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profileImage: true,
        timezone: true,
        themePreference: true,
        notificationPreference: true
      }
    });

    res.json({ message: "Avatar removed successfully", user: updatedUser });
  } catch (error) {
    console.error("Remove Avatar Error:", error);
    res.status(500).json({ message: "Server error removing avatar" });
  }
};

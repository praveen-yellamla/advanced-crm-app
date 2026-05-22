const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");

// Use memory storage to process file buffer before sending to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.use(protect);

router.get("/me", profileController.getProfile);
router.put("/update", profileController.updateProfile);
router.post("/avatar", upload.single("avatar"), profileController.uploadAvatar);
router.delete("/avatar", profileController.removeAvatar);

module.exports = router;

const express = require("express");
const multer = require("multer");

const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const { uploadImage, deleteImage } = require("../controllers/uploadController");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

router.use(protect);

router.post(
  "/image",
  authorize("admin", "branch_manager"),
  upload.single("image"),
  uploadImage,
);

router.delete("/image", authorize("admin", "branch_manager"), deleteImage);

module.exports = router;

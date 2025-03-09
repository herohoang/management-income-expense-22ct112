const express = require("express");
const multer = require("multer");
const router = express.Router();
const barberController = require("../controllers/barberController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const fs = require("fs");

// Cấu hình Multer để lưu file tạm trên disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Thư mục tạm để lưu file
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Tên file unique
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Chỉ được upload file ảnh!"));
    }
    cb(null, true);
  },
});

// Tạo thư mục uploads nếu chưa tồn tại
const fsPromises = fs.promises;
fsPromises.mkdir("uploads", { recursive: true }).catch(console.error);

router.get("/barbers", barberController.getAllBarbers);
router.get("/barbers/:id", authMiddleware, isAdmin, barberController.getBarberById);
router.post("/barbers", authMiddleware, isAdmin, upload.single("image"), barberController.createBarber);
router.put("/barbers/:id", authMiddleware, isAdmin, upload.single("image"), barberController.updateBarber);
router.delete("/barbers/:id", authMiddleware, isAdmin, barberController.deleteBarber);

module.exports = router;

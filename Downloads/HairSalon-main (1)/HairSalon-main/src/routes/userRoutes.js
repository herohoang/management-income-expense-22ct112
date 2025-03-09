const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const userController = require('../controllers/userController');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const fs = require('fs'); // Thêm fs để xử lý file trên disk

const router = express.Router();

// Cấu hình Multer để lưu file tạm trên disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Thư mục tạm để lưu file
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Tên file unique
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận file ảnh
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Chỉ được upload file ảnh!'));
    }
    cb(null, true);
  },
});

// Tạo thư mục uploads nếu chưa tồn tại
const fsPromises = fs.promises;
fsPromises.mkdir('uploads', { recursive: true }).catch(console.error);

// Các routes khác
router.get('/all', authMiddleware, userController.getAllUsers);
router.get('/:username', authMiddleware, userController.getUserByUsername);
router.put('/update/:username', authMiddleware, userController.updateUser);
router.delete('/delete/:username', authMiddleware, isAdmin, userController.deleteUser);

// Route cập nhật ảnh avatar
router.put('/:username/avatar', authMiddleware, upload.single('avatar'), userController.updateUserAvatar);

module.exports = router;

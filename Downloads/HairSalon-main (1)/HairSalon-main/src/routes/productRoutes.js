const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const multer = require('multer'); // Thêm multer

// Cấu hình Multer để lưu file tạm trên disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Thư mục tạm
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Tên file unique
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Chỉ được upload file ảnh!'));
    }
    cb(null, true);
  },
});

// Tạo thư mục uploads nếu chưa tồn tại
const fs = require('fs');
fs.promises.mkdir('uploads', { recursive: true }).catch(console.error);

// Routes
router.get('/getall', authMiddleware, productController.getAllProducts);
router.get('/:name', authMiddleware, productController.getProductByName);

// Route với upload ảnh
router.post('/', authMiddleware, isAdmin, upload.single('image'), productController.createProduct);
router.put('/:name', authMiddleware, isAdmin, upload.single('image'), productController.updateProductByName);

router.delete('/:name', authMiddleware, isAdmin, productController.deleteProductByName);

module.exports = router;

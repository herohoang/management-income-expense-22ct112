const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');

// Người dùng bình thường có thể lấy thông tin dịch vụ
router.get('/getall', authMiddleware, serviceController.getAllServices);
router.get('/:name', authMiddleware, serviceController.getServiceByName);
router.post('/create', authMiddleware, isAdmin, serviceController.createService);

// Chỉ admin mới có quyền thêm, cập nhật và xóa dịch vụ
router.put('/:name', authMiddleware, isAdmin, serviceController.updateServiceByName);
router.delete('/:name', authMiddleware, isAdmin, serviceController.deleteServiceByName);

module.exports = router;

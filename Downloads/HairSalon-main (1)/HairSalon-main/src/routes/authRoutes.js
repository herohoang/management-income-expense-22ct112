const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware'); 



const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/change-password', authMiddleware, authController.changePassword);
router.post('/logout', authController.logout);

module.exports = router;

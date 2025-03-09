const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authMiddleware, isAdmin, authenticate } = require("../middlewares/authMiddleware");

router.post('/create', authMiddleware, reviewController.createReview);
router.get('/', reviewController.getAllReviews);
router.get('/:username', authMiddleware, isAdmin, reviewController.getReviewsByUsername);
router.put('/:id', authMiddleware, isAdmin, reviewController.updateReview);
router.delete('/:id', authMiddleware, isAdmin, reviewController.deleteReview);

module.exports = router;

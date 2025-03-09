const Review = require('../models/reviewModel');
const pool = require('../db');

exports.createReview = async (req, res) => {
  try {
    const { username, rating, comment } = req.body;

    // Tìm user_id từ username
    const userQuery = await pool.query('SELECT id FROM users WHERE username = $1', [username]);

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "Người dùng không tồn tại!" });
    }

    const user_id = userQuery.rows[0].id;

    // Tạo review
    const review = await Review.create(user_id, rating, comment);
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.getAllWithUser();
    res.json(reviews);
  } catch (err) {
    console.error("Lỗi khi lấy đánh giá:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
};

exports.getReviewsByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const reviews = await Review.getByUsernameWithUser(username);
    res.json(reviews);
  } catch (err) {
    console.error("Lỗi khi lấy đánh giá theo username:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const review = await Review.update(id, rating, comment);
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await Review.delete(id);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

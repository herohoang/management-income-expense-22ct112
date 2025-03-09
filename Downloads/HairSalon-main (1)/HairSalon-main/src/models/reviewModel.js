const pool = require('../db');

const Review = {
  async create(user_id, rating, comment) {
    const result = await pool.query(
      `INSERT INTO reviews (user_id, rating, comment)
       VALUES ($1, $2, $3) RETURNING *;`,
      [user_id, rating, comment]
    );
    return result.rows[0];
  },

  async getAllWithUser() {
    const query = `
      SELECT 
        r.id, 
        r.user_id, 
        r.rating, 
        r.comment, 
        r.created_at,
        u.username,
        COALESCE(u.image_url, '/default-avatar.png') AS image_url
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  async getByUsernameWithUser(username) {
    const query = `
      SELECT 
        r.id, 
        r.user_id, 
        r.rating, 
        r.comment, 
        r.created_at,
        u.username,
        COALESCE(u.image_url, '/default-avatar.png') AS image_url
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE u.username = $1
      ORDER BY r.created_at DESC
    `;
    const { rows } = await pool.query(query, [username]);
    return rows;
  },

  async update(id, rating, comment) {
    const result = await pool.query(
      `UPDATE reviews r
       SET rating = $2, comment = $3
       FROM users u
       WHERE r.id = $1 AND r.user_id = u.id
       RETURNING 
         r.id, 
         r.user_id, 
         r.rating, 
         r.comment, 
         r.created_at,
         u.username,
         COALESCE(u.image_url, '/default-avatar.png') AS image_url;`,
      [id, rating, comment]
    );
    if (result.rows.length === 0) {
      throw new Error("Review không tồn tại");
    }
    return result.rows[0];
  },

  async delete(id) {
    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 RETURNING *;',
      [id]
    );
    if (result.rows.length === 0) {
      throw new Error("Review không tồn tại");
    }
    return { message: 'Review deleted' };
  }
};

module.exports = Review;

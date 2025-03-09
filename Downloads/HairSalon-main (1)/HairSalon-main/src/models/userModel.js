const pool = require("../db"); // Kết nối database

const User = {
  // 🟢 Tạo user mới
  create: async (username, email, hashedPassword, phone) => {
    const result = await pool.query(
      `INSERT INTO users (username, email, password, phone, user_type_id) 
       VALUES ($1, $2, $3, $4, 2) RETURNING *`, // Không insert `id`
      [username, email, hashedPassword, phone]
    );
    return result.rows[0];
  },

  // 🟢 Tìm user theo username (ĐÃ SỬA: Lấy `image_url`, `address`)
  findByUsername: async (username) => {
    const result = await pool.query(
      `SELECT id, user_type_id, username, email, password, phone, address, image_url, created_at 
       FROM users WHERE username = $1`, 
      [username]
    );
    return result.rows[0] || null;
  },

  // 🟢 Tìm user theo email
  findByEmail: async (email) => {
    const result = await pool.query(
      `SELECT id, username, email, phone, address, image_url 
       FROM users WHERE email = $1`, 
      [email]
    );
    return result.rows[0] || null;
  },

  // 🟢 Tìm user theo ID
  findById: async (id) => {
    const result = await pool.query(
      `SELECT id, username, email, phone, address, image_url 
       FROM users WHERE id = $1`, 
      [id]
    );
    return result.rows[0] || null;
  },

  // 🟢 Cập nhật mật khẩu
  updatePassword: async (id, hashedPassword) => {
    await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashedPassword, id]);
  },

  // 🟢 Lấy danh sách người dùng (ĐÃ SỬA: Thêm `address`)
  getAllUsers: async () => {
    const result = await pool.query(
      `SELECT id, username, email, phone, address, image_url FROM users`
    );
    return result.rows;
  },

  // 🟢 Lấy thông tin user theo username (ĐÃ SỬA: Thêm `address`)
  getUserByUsername: async (req, res) => {
    try {
      const { username } = req.params;
      const requestUser = req.user.username; // Username từ token
      const isAdmin = req.user.user_type_id === 1;

      // Kiểm tra quyền truy cập
      if (!isAdmin && username !== requestUser) {
        return res.status(403).json({ message: "Bạn không có quyền truy cập thông tin này!" });
      }

      const user = await User.findByUsername(username);
      if (!user) return res.status(404).json({ message: "Người dùng không tồn tại!" });

      // Trả về thông tin (bao gồm ảnh đại diện)
      const userData = {
        username: user.username,
        phone: user.phone,
        address: user.address, // 🛠️ Đã thêm địa chỉ
        created_at: user.created_at,
        image_url: user.image_url, // 🛠️ Đã thêm đường dẫn ảnh
        ...(isAdmin && { email: user.email }) // Admin có thể xem email
      };

      res.status(200).json(userData);
    } catch (error) {
      console.error("Lỗi khi lấy user:", error);
      res.status(500).json({ message: "Lỗi server!" });
    }
  },

  // 🟢 Cập nhật thông tin người dùng (bao gồm `address`, `image_url`)
  updateUser: async (id, { username, email, phone, address, image_url }) => {
    const result = await pool.query(
      `UPDATE users 
       SET username = $1, email = $2, phone = $3, address = $4, image_url = $5
       WHERE id = $6 
       RETURNING *`,
      [username, email, phone, address, image_url, id] // 🛠️ Đã sửa lỗi `$5` -> `$6`
    );
    return result.rows[0];
  },

  // 🟢 Xóa người dùng theo ID
  deleteUser: async (id) => {
    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
  }
};

module.exports = User;

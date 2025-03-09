const pool = require('../db');
const cloudinary = require('../config/cloudinary');
const fs = require('fs'); // Thêm fs để xóa file tạm

const userController = {
  // Lấy tất cả người dùng
  getAllUsers: async (req, res) => {
    try {
      const result = await pool.query('SELECT username, email, phone, address, image_url, created_at FROM users');
      res.json(result.rows);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách người dùng:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // Lấy người dùng theo username
  getUserByUsername: async (req, res) => {
    try {
      const { username } = req.params;
      const result = await pool.query('SELECT username, email, phone, address, image_url, created_at FROM users WHERE username = $1', [username]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Lỗi khi lấy người dùng:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // Cập nhật ảnh đại diện của người dùng
  updateUserAvatar: async (req, res) => {
    try {
      const { username } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: 'Không có ảnh được tải lên!' });
      }

      // Lấy thông tin ảnh cũ từ database để xóa sau
      const userResult = await pool.query('SELECT image_url FROM users WHERE username = $1', [username]);
      if (userResult.rows.length === 0) {
        fs.unlinkSync(req.file.path); // Xóa file tạm nếu user không tồn tại
        return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
      }
      const oldImageUrl = userResult.rows[0].image_url;

      // Upload ảnh mới lên Cloudinary
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "avatars",
        overwrite: true, // Ghi đè nếu trùng tên (tùy chọn)
      });

      // Xóa file tạm sau khi upload
      fs.unlinkSync(req.file.path);

      // Xóa ảnh cũ trên Cloudinary nếu tồn tại
      if (oldImageUrl) {
        const publicId = oldImageUrl.split('/').pop().split('.')[0]; // Lấy public_id từ URL
        await cloudinary.uploader.destroy(`avatars/${publicId}`).catch((err) => {
          console.error('Lỗi khi xóa ảnh cũ trên Cloudinary:', err);
        });
      }

      // Lấy URL từ Cloudinary
      const imageUrl = uploadResult.secure_url;

      // Cập nhật database với URL mới
      const updateResult = await pool.query(
        'UPDATE users SET image_url = $1 WHERE username = $2 RETURNING *',
        [imageUrl, username]
      );

      res.json({ 
        message: 'Cập nhật ảnh thành công!', 
        image_url: imageUrl, 
        user: updateResult.rows[0] 
      });
    } catch (error) {
      // Xóa file tạm nếu có lỗi
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Lỗi khi cập nhật ảnh:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // Cập nhật thông tin người dùng
  updateUser: async (req, res) => {
    try {
      const { username } = req.params;
      const { newUsername, email, phone, address, image_url } = req.body;

      const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
      }

      const updates = [];
      const values = [];
      let queryIndex = 1;

      if (newUsername) {
        updates.push(`username = $${queryIndex}`);
        values.push(newUsername);
        queryIndex++;
      }
      if (email) {
        updates.push(`email = $${queryIndex}`);
        values.push(email);
        queryIndex++;
      }
      if (phone) {
        updates.push(`phone = $${queryIndex}`);
        values.push(phone);
        queryIndex++;
      }
      if (address) {
        updates.push(`address = $${queryIndex}`);
        values.push(address);
        queryIndex++;
      }
      if (image_url) {
        updates.push(`image_url = $${queryIndex}`);
        values.push(image_url);
        queryIndex++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: 'Không có thông tin cần cập nhật!' });
      }

      values.push(username);

      const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE username = $${queryIndex} RETURNING *`;

      const result = await pool.query(updateQuery, values);

      res.json({ message: 'Cập nhật thành công!', user: result.rows[0] });
    } catch (error) {
      console.error('Lỗi khi cập nhật người dùng:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // Xóa người dùng theo username
  deleteUser: async (req, res) => {
    try {
      const { username } = req.params;
      const result = await pool.query('DELETE FROM users WHERE username = $1 RETURNING *', [username]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
      }

      res.json({ message: 'Xóa người dùng thành công!', user: result.rows[0] });
    } catch (error) {
      console.error('Lỗi khi xóa người dùng:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },
};

module.exports = userController;

const pool = require('../db');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');

// 🟢 Tạo đơn hàng mới (KHÁCH HÀNG)
exports.createOrder = async (req, res) => {
  try {
    const { items, payment_method } = req.body;
    const user_id = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Danh sách sản phẩm không được để trống' });
    }

    let totalAmount = 0;
    for (let item of items) {
      const productResult = await pool.query('SELECT id, price FROM products WHERE name = $1', [item.product_name]);
      if (productResult.rowCount === 0) {
        return res.status(400).json({ message: `Sản phẩm '${item.product_name}' không tồn tại` });
      }
      const { id, price } = productResult.rows[0];
      item.product_id = id;
      item.price_at_time = price;
      totalAmount += price * item.quantity;
    }

    totalAmount += 30000; // Cộng phí ship 30k vào tổng tiền

    const orderResult = await pool.query(
      'INSERT INTO orders (user_id, total_amount, status, payment_method) VALUES ($1, $2, $3, $4) RETURNING id',
      [user_id, totalAmount, 'pending', payment_method || 'cash']
    );
    const order_id = orderResult.rows[0].id;

    for (let item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)',
        [order_id, item.product_id, item.quantity, item.price_at_time]
      );
    }

    res.status(201).json({ message: 'Tạo đơn hàng thành công', order_id });
  } catch (err) {
    console.error('Lỗi khi tạo đơn hàng:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// 🟢 Tạo đánh giá sản phẩm (KHÁCH HÀNG)
exports.createReview = async (req, res) => {
  try {
    const { order_id, product_id, rating, comment } = req.body;
    const user_id = req.user.id;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Điểm đánh giá phải từ 1 đến 5' });
    }

    const orderCheck = await pool.query(
      'SELECT id FROM orders WHERE id = $1 AND user_id = $2 AND status = $3',
      [order_id, user_id, 'completed']
    );
    if (orderCheck.rowCount === 0) {
      return res.status(400).json({ message: 'Đơn hàng không tồn tại hoặc chưa hoàn thành' });
    }

    const itemCheck = await pool.query(
      'SELECT id FROM order_items WHERE order_id = $1 AND product_id = $2',
      [order_id, product_id]
    );
    if (itemCheck.rowCount === 0) {
      return res.status(400).json({ message: 'Sản phẩm không thuộc đơn hàng này' });
    }

    const reviewCheck = await pool.query(
      'SELECT id FROM revieworder WHERE user_id = $1 AND order_id = $2 AND product_id = $3',
      [user_id, order_id, product_id]
    );
    if (reviewCheck.rowCount > 0) {
      return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi' });
    }

    await pool.query(
      'INSERT INTO revieworder (user_id, product_id, order_id, rating, comment) VALUES ($1, $2, $3, $4, $5)',
      [user_id, product_id, order_id, rating, comment || '']
    );

    res.status(201).json({ message: 'Đánh giá sản phẩm thành công' });
  } catch (err) {
    console.error('Lỗi khi tạo đánh giá:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// 🟡 Lấy danh sách tất cả đơn hàng (ADMIN)
exports.getAllOrders = [authMiddleware, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.id, u.username AS user_name, o.total_amount, o.status, o.created_at, o.payment_method,
             json_agg(
               json_build_object(
                 'product_name', p.name,
                 'quantity', oi.quantity,
                 'price_at_time', oi.price_at_time,
                 'review', (
                   SELECT json_build_object('rating', r.rating, 'comment', r.comment)
                   FROM revieworder r
                   WHERE r.order_id = o.id AND r.product_id = p.id
                   LIMIT 1
                 )
               )
             ) AS items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      GROUP BY o.id, u.username
      ORDER BY o.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách đơn hàng:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
}];

// 🟡 Lấy danh sách đơn hàng của user (KHÁCH HÀNG)
exports.getOrdersByUsername = [authMiddleware, async (req, res) => {
  try {
    const username = req.headers['x-username'];
    if (!username) {
      return res.status(400).json({ message: "Thiếu username trong header X-Username" });
    }

    const result = await pool.query(`
      SELECT o.id, o.total_amount, o.status, o.created_at, o.payment_method,
             json_agg(
               json_build_object(
                 'product_id', p.id,
                 'product_name', p.name,
                 'quantity', oi.quantity,
                 'price_at_time', oi.price_at_time,
                 'review', (
                   SELECT json_build_object('rating', r.rating, 'comment', r.comment)
                   FROM revieworder r
                   WHERE r.order_id = o.id AND r.product_id = p.id
                   LIMIT 1
                 )
               )
             ) AS items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      JOIN users u ON o.user_id = u.id
      WHERE u.username = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [username]);

    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi khi lấy đơn hàng của user:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
}];


// 🟠 Cập nhật trạng thái đơn hàng (ADMIN)
exports.updateOrder = [authMiddleware, isAdmin, async (req, res) => {
  try {
    const { order_id, status } = req.body;

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, order_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    res.json({ message: 'Cập nhật đơn hàng thành công', order: result.rows[0] });
  } catch (err) {
    console.error('Lỗi khi cập nhật đơn hàng:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
}];

// 🔴 Xóa đơn hàng (ADMIN)
exports.deleteOrder = [authMiddleware, isAdmin, async (req, res) => {
  try {
    const { order_id } = req.body;

    await pool.query('DELETE FROM revieworder WHERE order_id = $1', [order_id]);
    await pool.query('DELETE FROM order_items WHERE order_id = $1', [order_id]);
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [order_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    res.json({ message: 'Xóa đơn hàng thành công' });
  } catch (err) {
    console.error('Lỗi khi xóa đơn hàng:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
}];

// 🟡 Lấy đánh giá theo sản phẩm (Công khai)
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;

    const result = await pool.query(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.username AS user_name
      FROM revieworder r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
    `, [product_id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi khi lấy đánh giá theo sản phẩm:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

module.exports = {
  createOrder: exports.createOrder,
  createReview: exports.createReview,
  getAllOrders: exports.getAllOrders,
  getOrdersByUsername: exports.getOrdersByUsername,
  updateOrder: exports.updateOrder,
  deleteOrder: exports.deleteOrder,
  getReviewsByProduct: exports.getReviewsByProduct
};

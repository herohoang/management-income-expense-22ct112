const pool = require('../db'); // Kết nối DB

const Product = {
  // Lấy tất cả sản phẩm
  async getAll() {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    return result.rows;
  },

  // Lấy sản phẩm theo tên
  async getByName(name) {
    const result = await pool.query('SELECT * FROM products WHERE name = $1', [name]);
    return result.rows[0];
  },

  // Thêm sản phẩm
async create(product) {
  const { name, description, price, stock, image_url } = product;
  const result = await pool.query(
    `INSERT INTO products (name, description, price, stock, image_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, description, price, stock, image_url]
  );
  return result.rows[0];
},

  // Cập nhật sản phẩm theo tên
  async updateByName(name, { description, price, stock, image_url }) {
    const result = await pool.query(
      'UPDATE products SET description = $1, price = $2, stock = $3, image_url = $4 WHERE name = $5 RETURNING *',
      [description, price, stock, image_url, name]
    );
    return result.rows[0];
  },

  // Xóa sản phẩm theo tên
  async deleteByName(name) {
    const result = await pool.query('DELETE FROM products WHERE name = $1 RETURNING *', [name]);
    return result.rows[0];
  }
};

module.exports = Product;
